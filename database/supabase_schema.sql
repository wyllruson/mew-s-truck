-- Mew's Truck — Supabase (Postgres) schema, RLS, and RPCs
-- Run in Supabase SQL Editor after creating a project.
-- Then run database/supabase_seed.sql

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS boundaries_crossed (
  id integer PRIMARY KEY,
  name text NOT NULL,
  image_path text NOT NULL,
  price numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES boundaries_crossed (id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  total_price numeric(10, 2) NOT NULL,
  order_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES boundaries_crossed (id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  comments text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Profile trigger (signup metadata: username)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: checkout (atomic order + line items + clear cart)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.checkout()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cart_row record;
  total numeric(10, 2) := 0;
  new_order_id bigint;
  product_price numeric(10, 2);
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = uid) THEN
    RAISE EXCEPTION 'Your cart is empty.';
  END IF;

  FOR cart_row IN
    SELECT ci.product_id, ci.quantity, bc.price
    FROM cart_items ci
    JOIN boundaries_crossed bc ON bc.id = ci.product_id
    WHERE ci.user_id = uid
  LOOP
    total := total + (cart_row.price * cart_row.quantity);
  END LOOP;

  INSERT INTO orders (user_id, total_price)
  VALUES (uid, total)
  RETURNING id INTO new_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT new_order_id, ci.product_id, ci.quantity, bc.price
  FROM cart_items ci
  JOIN boundaries_crossed bc ON bc.id = ci.product_id
  WHERE ci.user_id = uid;

  DELETE FROM cart_items WHERE user_id = uid;

  RETURN jsonb_build_object(
    'message', 'Order placed successfully!',
    'orderId', new_order_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: buy mystery card
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.buy_mystery_card()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  card record;
  new_order_id bigint;
  mystery_price constant numeric(10, 2) := 5.00;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id, name, image_path
  INTO card
  FROM boundaries_crossed
  ORDER BY random()
  LIMIT 1;

  IF card.id IS NULL THEN
    RAISE EXCEPTION 'No cards available for purchase.';
  END IF;

  INSERT INTO orders (user_id, total_price)
  VALUES (uid, mystery_price)
  RETURNING id INTO new_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES (new_order_id, card.id, 1, mystery_price);

  RETURN jsonb_build_object(
    'message', 'Mystery card purchased successfully and order placed!',
    'order', jsonb_build_object(
      'order_id', new_order_id,
      'card_name', card.name,
      'image_path', card.image_path,
      'price', mystery_price
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundaries_crossed ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles are viewable by owner"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles are updatable by owner"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public catalog
CREATE POLICY "Catalog is public read"
  ON boundaries_crossed FOR SELECT
  TO anon, authenticated
  USING (true);

-- cart_items
CREATE POLICY "Users manage own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- orders (read own; inserts via RPC only)
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- order_items (read via join to own orders)
CREATE POLICY "Users read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- contact form (anyone authenticated or anon can submit)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Grants for RPCs
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.checkout() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_mystery_card() TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: username availability (signup; safe public check)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_username_taken(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(trim(p_username))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_taken(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: email lookup for username login (no broad profile exposure)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email
  FROM profiles
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;
