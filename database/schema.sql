-- Mew's Truck — Supabase (Postgres) schema, RLS, and RPCs
--
-- Safe to re-run: migrates legacy schema, then applies the current structure.
-- Run database/seed.sql afterward for catalog data (also safe to re-run).
--
-- Responsibilities:
--   schema  → tables, columns, FKs, functions, RLS, grants
--   seed    → pokemon_cards row data (upserts; does not touch carts/orders)
--
-- Renamed the catalog table? Add the old name to legacy_catalog_names below.

-- ---------------------------------------------------------------------------
-- Catalog table transitions (extend legacy_catalog_names when renaming)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  legacy_name text;
  legacy_catalog_names text[] := ARRAY['add_old_name_here'];
  fk record;
  legacy_has_stock boolean;
  merge_sql text;
BEGIN
  FOREACH legacy_name IN ARRAY legacy_catalog_names LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = legacy_name
    ) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pokemon_cards'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO pokemon_cards', legacy_name);
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = legacy_name
        AND column_name = 'stock'
    ) INTO legacy_has_stock;

    IF legacy_has_stock THEN
      merge_sql := format(
        $sql$
        INSERT INTO public.pokemon_cards (id, name, image_path, price, stock)
        SELECT id, name, image_path, price, stock
        FROM public.%I
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          image_path = EXCLUDED.image_path,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock
        $sql$,
        legacy_name
      );
    ELSE
      merge_sql := format(
        $sql$
        INSERT INTO public.pokemon_cards (id, name, image_path, price, stock)
        SELECT id, name, image_path, price, 1
        FROM public.%I
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          image_path = EXCLUDED.image_path,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock
        $sql$,
        legacy_name
      );
    END IF;

    EXECUTE merge_sql;

    FOR fk IN
      SELECT
        c.conname,
        child.relname AS child_table,
        att.attname AS child_column
      FROM pg_constraint c
      JOIN pg_class ref ON ref.oid = c.confrelid
      JOIN pg_namespace nsp ON nsp.oid = ref.relnamespace
      JOIN pg_class child ON child.oid = c.conrelid
      JOIN pg_attribute att
        ON att.attrelid = c.conrelid AND att.attnum = c.conkey[1]
      WHERE c.contype = 'f'
        AND nsp.nspname = 'public'
        AND ref.relname = legacy_name
        AND array_length(c.conkey, 1) = 1
    LOOP
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        fk.child_table,
        fk.conname
      );
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.pokemon_cards (id)',
        fk.child_table,
        fk.conname,
        fk.child_column
      );
    END LOOP;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      'Catalog is public read',
      legacy_name
    );
    EXECUTE format('DROP TABLE public.%I', legacy_name);
  END LOOP;
END $$;

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

CREATE TABLE IF NOT EXISTS pokemon_cards (
  id integer PRIMARY KEY,
  name text NOT NULL,
  image_path text NOT NULL,
  price numeric(10, 2) NOT NULL,
  stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES pokemon_cards (id),
  is_mystery boolean NOT NULL DEFAULT false,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  CONSTRAINT cart_items_user_id_product_id_is_mystery_key UNIQUE (user_id, product_id, is_mystery)
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
  product_id integer NOT NULL REFERENCES pokemon_cards (id),
  is_mystery boolean NOT NULL DEFAULT false,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS mystery_shop_purchases (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES pokemon_cards (id),
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  comments text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Column migrations (safe to re-run; add new columns here)

ALTER TABLE pokemon_cards
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Unknown';

ALTER TABLE pokemon_cards
  ADD COLUMN IF NOT EXISTS image_path text NOT NULL DEFAULT '/assets/images/placeholder.png';

ALTER TABLE pokemon_cards
  ADD COLUMN IF NOT EXISTS price numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE pokemon_cards
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 1;

ALTER TABLE pokemon_cards
  ALTER COLUMN stock SET DEFAULT 1;

UPDATE pokemon_cards SET name = 'Unknown' WHERE name IS NULL OR btrim(name) = '';
UPDATE pokemon_cards
SET image_path = '/assets/images/placeholder.png'
WHERE image_path IS NULL OR btrim(image_path) = '';
UPDATE pokemon_cards SET price = 0 WHERE price IS NULL;
UPDATE pokemon_cards SET stock = 1 WHERE stock IS NULL;

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS is_mystery boolean NOT NULL DEFAULT false;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_mystery boolean NOT NULL DEFAULT false;

UPDATE cart_items SET is_mystery = false WHERE is_mystery IS NULL;
UPDATE order_items SET is_mystery = false WHERE is_mystery IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.cart_items'::regclass
      AND conname = 'cart_items_user_id_product_id_key'
  ) THEN
    ALTER TABLE cart_items
      DROP CONSTRAINT cart_items_user_id_product_id_key;
  END IF;
END;
$$;

DO $$
BEGIN
  ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_user_id_product_id_is_mystery_key UNIQUE (user_id, product_id, is_mystery);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE pokemon_cards
    ADD CONSTRAINT pokemon_cards_stock_check CHECK (stock >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Auth signup → profiles row

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

-- Server-side business logic (SECURITY DEFINER RPCs)

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
  mystery_price constant numeric(10, 2) := 5.00;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = uid) THEN
    RAISE EXCEPTION 'Your cart is empty.';
  END IF;

  FOR cart_row IN
    SELECT ci.product_id, ci.quantity, ci.is_mystery, pc.price, pc.name, pc.stock
    FROM cart_items ci
    JOIN pokemon_cards pc ON pc.id = ci.product_id
    WHERE ci.user_id = uid
  LOOP
    IF cart_row.quantity > cart_row.stock THEN
      RAISE EXCEPTION '% only has % in stock.', cart_row.name, cart_row.stock;
    END IF;
  END LOOP;

  FOR cart_row IN
    SELECT ci.product_id, ci.quantity, ci.is_mystery, pc.price
    FROM cart_items ci
    JOIN pokemon_cards pc ON pc.id = ci.product_id
    WHERE ci.user_id = uid
  LOOP
    total := total + (
      CASE
        WHEN cart_row.is_mystery THEN mystery_price
        ELSE cart_row.price
      END * cart_row.quantity
    );
  END LOOP;

  INSERT INTO orders (user_id, total_price)
  VALUES (uid, total)
  RETURNING id INTO new_order_id;

  INSERT INTO order_items (order_id, product_id, is_mystery, quantity, price)
  SELECT
    new_order_id,
    ci.product_id,
    ci.is_mystery,
    ci.quantity,
    CASE
      WHEN ci.is_mystery THEN mystery_price
      ELSE pc.price
    END
  FROM cart_items ci
  JOIN pokemon_cards pc ON pc.id = ci.product_id
  WHERE ci.user_id = uid;

  FOR cart_row IN
    SELECT ci.product_id, ci.quantity, pc.name
    FROM cart_items ci
    JOIN pokemon_cards pc ON pc.id = ci.product_id
    WHERE ci.user_id = uid
  LOOP
    UPDATE pokemon_cards
    SET stock = stock - cart_row.quantity
    WHERE id = cart_row.product_id
      AND stock >= cart_row.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION '% only has limited stock available.', cart_row.name;
    END IF;
  END LOOP;

  INSERT INTO mystery_shop_purchases (user_id, product_id, week_start)
  SELECT
    uid,
    ci.product_id,
    date_trunc('week', now())::date
  FROM cart_items ci
  WHERE ci.user_id = uid
    AND ci.is_mystery = true
  ON CONFLICT (user_id, week_start) DO NOTHING;

  DELETE FROM cart_items WHERE user_id = uid;

  RETURN jsonb_build_object(
    'message', 'Order placed successfully!',
    'orderId', new_order_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_mystery_card()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  week_start_date date := date_trunc('week', now())::date;
  card record;
  existing_cart_item_id bigint;
  mystery_price constant numeric(10, 2) := 5.00;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM mystery_shop_purchases msp
    WHERE msp.user_id = uid
      AND msp.week_start = week_start_date
  ) THEN
    RAISE EXCEPTION 'Mystery Shop is closed for your account until next Monday.';
  END IF;

  SELECT ci.id
  INTO existing_cart_item_id
  FROM cart_items ci
  WHERE ci.user_id = uid
    AND ci.is_mystery = true
  LIMIT 1;

  IF existing_cart_item_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a mystery card waiting in cart.';
  END IF;

  SELECT pc.id, pc.name, pc.image_path
  INTO card
  FROM pokemon_cards pc
  WHERE pc.stock > 0
    AND NOT EXISTS (
    SELECT 1
    FROM cart_items ci
    WHERE ci.user_id = uid
      AND ci.product_id = pc.id
  )
  ORDER BY random()
  LIMIT 1;

  IF card.id IS NULL THEN
    RAISE EXCEPTION 'No cards available for purchase.';
  END IF;

  INSERT INTO cart_items (user_id, product_id, is_mystery, quantity)
  VALUES (uid, card.id, true, 1);

  RETURN jsonb_build_object(
    'message', 'Mystery card added to cart successfully.',
    'order', jsonb_build_object(
      'card_name', card.name,
      'image_path', card.image_path,
      'price', mystery_price
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_mystery_shop_open()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  week_start_date date := date_trunc('week', now())::date;
BEGIN
  IF uid IS NULL THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM mystery_shop_purchases msp
    WHERE msp.user_id = uid
      AND msp.week_start = week_start_date
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

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

-- Row Level Security policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mystery_shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
CREATE POLICY "Profiles are viewable by owner"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are updatable by owner" ON profiles;
CREATE POLICY "Profiles are updatable by owner"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Catalog is public read" ON pokemon_cards;
CREATE POLICY "Catalog is public read"
  ON pokemon_cards FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own cart" ON cart_items;
CREATE POLICY "Users manage own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own orders" ON orders;
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own order items" ON order_items;
CREATE POLICY "Users read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users read own mystery purchases" ON mystery_shop_purchases;
CREATE POLICY "Users read own mystery purchases"
  ON mystery_shop_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own mystery purchases" ON mystery_shop_purchases;
CREATE POLICY "Users create own mystery purchases"
  ON mystery_shop_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RPC execute permissions

GRANT EXECUTE ON FUNCTION public.checkout() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_mystery_card() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mystery_shop_open() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_taken(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;
