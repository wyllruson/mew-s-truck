-- Pokemon card catalog
-- Safe to re-run: upserts rows into pokemon_cards.
-- Does not modify schema, carts, orders, or user data.
-- Run database/schema.sql first.

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (1, 'Oddish', '/assets/images/sets/1.png', 0.27, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (2, 'Gloom', '/assets/images/sets/2.png', 0.31, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (3, 'Vileplume', '/assets/images/sets/3.png', 1.81, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (4, 'Bellossom', '/assets/images/sets/4.png', 0.49, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (5, 'Tangela', '/assets/images/sets/5.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (6, 'Tangrowth', '/assets/images/sets/6.png', 1.06, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (7, 'Scyther', '/assets/images/sets/7.png', 0.79, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (8, 'Heracross', '/assets/images/sets/8.png', 0.79, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (9, 'Celebi-EX', '/assets/images/sets/9.png', 13.48, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (10, 'Shaymin', '/assets/images/sets/10.png', 1.21, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (11, 'Snivy', '/assets/images/sets/11.png', 0.21, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (12, 'Servine', '/assets/images/sets/12.png', 0.63, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (13, 'Serperior', '/assets/images/sets/13.png', 3.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (14, 'Cottonee', '/assets/images/sets/14.png', 0.28, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (15, 'Whimsicott', '/assets/images/sets/15.png', 0.41, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (16, 'Petilil', '/assets/images/sets/16.png', 0.38, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (17, 'Lilligant', '/assets/images/sets/17.png', 0.42, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (18, 'Charmander', '/assets/images/sets/18.png', 1.75, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (19, 'Charmeleon', '/assets/images/sets/19.png', 0.92, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (20, 'Charizard', '/assets/images/sets/20.png', 23.67, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (21, 'Numel', '/assets/images/sets/21.png', 0.11, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (22, 'Camerupt', '/assets/images/sets/22.png', 0.21, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (23, 'Victini', '/assets/images/sets/23.png', 0.39, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (24, 'Tepig', '/assets/images/sets/24.png', 0.38, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (25, 'Pignite', '/assets/images/sets/25.png', 0.71, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (26, 'Emboar', '/assets/images/sets/26.png', 3.07, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (27, 'Darumaka', '/assets/images/sets/27.png', 0.17, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (28, 'Darmanitan', '/assets/images/sets/28.png', 0.39, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (29, 'Squirtle', '/assets/images/sets/29.png', 1.14, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (30, 'Wartortle', '/assets/images/sets/30.png', 0.27, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (31, 'Blastoise', '/assets/images/sets/31.png', 13.50, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (32, 'Psyduck', '/assets/images/sets/32.png', 1.48, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (33, 'Psyduck', '/assets/images/sets/33.png', 0.44, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (34, 'Golduck', '/assets/images/sets/34.png', 0.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (35, 'Golduck', '/assets/images/sets/35.png', 0.31, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (36, 'Marill', '/assets/images/sets/36.png', 0.41, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (37, 'Azumarill', '/assets/images/sets/37.png', 0.33, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (38, 'Delibird', '/assets/images/sets/38.png', 0.27, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (39, 'Oshawott', '/assets/images/sets/39.png', 0.29, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (40, 'Dewott', '/assets/images/sets/40.png', 0.56, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (41, 'Samurott', '/assets/images/sets/41.png', 1.51, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (42, 'Ducklett', '/assets/images/sets/42.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (43, 'Swanna', '/assets/images/sets/43.png', 0.30, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (44, 'Frillish', '/assets/images/sets/44.png', 0.22, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (45, 'Jellicent', '/assets/images/sets/45.png', 0.55, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (46, 'Cryogonal', '/assets/images/sets/46.png', 0.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (47, 'Keldeo', '/assets/images/sets/47.png', 0.87, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (48, 'Keldeo', '/assets/images/sets/48.png', 0.33, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (49, 'Keldeo-EX', '/assets/images/sets/49.png', 0.92, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (50, 'Pikachu', '/assets/images/sets/50.png', 1.48, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (51, 'Voltorb', '/assets/images/sets/51.png', 0.16, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (52, 'Electrode', '/assets/images/sets/52.png', 0.17, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (53, 'Electabuzz', '/assets/images/sets/53.png', 0.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (54, 'Electivire', '/assets/images/sets/54.png', 1.07, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (55, 'Chinchou', '/assets/images/sets/55.png', 0.22, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (56, 'Blitzle', '/assets/images/sets/56.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (57, 'Zebstrika', '/assets/images/sets/57.png', 1.77, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (58, 'Wobbuffet', '/assets/images/sets/58.png', 0.51, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (59, 'Spoink', '/assets/images/sets/59.png', 0.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (60, 'Grumpig', '/assets/images/sets/60.png', 0.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (61, 'Duskull', '/assets/images/sets/61.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (62, 'Dusclops', '/assets/images/sets/62.png', 0.32, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (63, 'Dusknoir', '/assets/images/sets/63.png', 4.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (64, 'Croagunk', '/assets/images/sets/64.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (65, 'Croagunk', '/assets/images/sets/65.png', 0.32, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (66, 'Toxicroak', '/assets/images/sets/66.png', 0.44, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (67, 'Cresselia-EX', '/assets/images/sets/67.png', 7.12, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (68, 'Munna', '/assets/images/sets/68.png', 0.96, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (69, 'Musharna', '/assets/images/sets/69.png', 0.39, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (70, 'Woobat', '/assets/images/sets/70.png', 0.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (71, 'Swoobat', '/assets/images/sets/71.png', 0.37, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (72, 'Venipede', '/assets/images/sets/72.png', 0.30, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (73, 'Whirlipede', '/assets/images/sets/73.png', 0.38, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (74, 'Scolipede', '/assets/images/sets/74.png', 2.62, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (75, 'Gothita', '/assets/images/sets/75.png', 0.26, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (76, 'Gothorita', '/assets/images/sets/76.png', 0.26, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (77, 'Meloetta', '/assets/images/sets/77.png', 2.58, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (78, 'Sandshrew', '/assets/images/sets/78.png', 0.41, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (79, 'Sandslash', '/assets/images/sets/79.png', 0.47, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (80, 'Gligar', '/assets/images/sets/80.png', 0.15, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (81, 'Gliscor', '/assets/images/sets/81.png', 0.97, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (82, 'Makuhita', '/assets/images/sets/82.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (83, 'Trapinch', '/assets/images/sets/83.png', 0.29, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (84, 'Dwebble', '/assets/images/sets/84.png', 0.41, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (85, 'Crustle', '/assets/images/sets/85.png', 2.90, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (86, 'Mienfoo', '/assets/images/sets/86.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (87, 'Mienfoo', '/assets/images/sets/87.png', 0.29, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (88, 'Mienshao', '/assets/images/sets/88.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (89, 'Landorus-EX', '/assets/images/sets/89.png', 9.44, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (90, 'Purrloin', '/assets/images/sets/90.png', 0.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (91, 'Liepard', '/assets/images/sets/91.png', 2.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (92, 'Vullaby', '/assets/images/sets/92.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (93, 'Mandibuzz', '/assets/images/sets/93.png', 0.29, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (94, 'Scizor', '/assets/images/sets/94.png', 3.97, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (95, 'Skarmory', '/assets/images/sets/95.png', 0.27, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (96, 'Skarmory', '/assets/images/sets/96.png', 0.49, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (97, 'Klink', '/assets/images/sets/97.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (98, 'Vibrava', '/assets/images/sets/98.png', 0.40, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (99, 'Flygon', '/assets/images/sets/99.png', 2.94, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (100, 'Black Kyurem', '/assets/images/sets/100.png', 0.61, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (101, 'Black Kyurem-EX', '/assets/images/sets/101.png', 2.10, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (102, 'White Kyurem', '/assets/images/sets/102.png', 0.40, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (103, 'White Kyurem-EX', '/assets/images/sets/103.png', 1.79, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (104, 'Rattata', '/assets/images/sets/104.png', 0.39, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (105, 'Raticate', '/assets/images/sets/105.png', 2.95, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (106, 'Meowth', '/assets/images/sets/106.png', 0.34, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (107, 'Farfetch''d', '/assets/images/sets/107.png', 0.52, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (108, 'Ditto', '/assets/images/sets/108.png', 10.05, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (109, 'Snorlax', '/assets/images/sets/109.png', 1.30, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (110, 'Togepi', '/assets/images/sets/110.png', 1.17, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (111, 'Dunsparce', '/assets/images/sets/111.png', 0.26, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (112, 'Taillow', '/assets/images/sets/112.png', 0.22, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (113, 'Skitty', '/assets/images/sets/113.png', 0.30, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (114, 'Delcatty', '/assets/images/sets/114.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (115, 'Spinda', '/assets/images/sets/115.png', 0.27, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (116, 'Buneary', '/assets/images/sets/116.png', 0.35, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (117, 'Lopunny', '/assets/images/sets/117.png', 0.45, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (118, 'Patrat', '/assets/images/sets/118.png', 0.21, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (119, 'Watchog', '/assets/images/sets/119.png', 0.24, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (120, 'Lillipup', '/assets/images/sets/120.png', 0.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (121, 'Herdier', '/assets/images/sets/121.png', 0.26, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (122, 'Stoutland', '/assets/images/sets/122.png', 3.40, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (123, 'Pidove', '/assets/images/sets/123.png', 0.26, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (124, 'Tranquill', '/assets/images/sets/124.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (125, 'Unfezant', '/assets/images/sets/125.png', 0.43, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (126, 'Audino', '/assets/images/sets/126.png', 0.49, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (127, 'Aspertia City Gym', '/assets/images/sets/127.png', 0.28, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (128, 'Energy Search', '/assets/images/sets/128.png', 0.13, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (129, 'Great Ball', '/assets/images/sets/129.png', 0.19, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (130, 'Hugh', '/assets/images/sets/130.png', 0.20, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (131, 'Poké Ball', '/assets/images/sets/131.png', 0.19, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (132, 'Potion', '/assets/images/sets/132.png', 0.13, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (133, 'Rocky Helmet', '/assets/images/sets/133.png', 0.25, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (134, 'Skyla', '/assets/images/sets/134.png', 0.21, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (135, 'Switch', '/assets/images/sets/135.png', 0.15, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (136, 'Town Map', '/assets/images/sets/136.png', 3.57, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (137, 'Computer Search', '/assets/images/sets/137.png', 32.93, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (138, 'Crystal Edge', '/assets/images/sets/138.png', 1.91, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (139, 'Crystal Wall', '/assets/images/sets/139.png', 2.11, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (140, 'Gold Potion', '/assets/images/sets/140.png', 9.22, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (141, 'Celebi-EX', '/assets/images/sets/141.png', 54.58, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (142, 'Keldeo-EX', '/assets/images/sets/142.png', 40.46, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (143, 'Cresselia-EX', '/assets/images/sets/143.png', 30.93, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (144, 'Landorus-EX', '/assets/images/sets/144.png', 58.11, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (145, 'Black Kyurem-EX', '/assets/images/sets/145.png', 156.12, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (146, 'White Kyurem-EX', '/assets/images/sets/146.png', 128.99, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (147, 'Bianca', '/assets/images/sets/147.png', 199.99, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (148, 'Cheren', '/assets/images/sets/148.png', 64.57, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (149, 'Skyla', '/assets/images/sets/149.png', 215.23, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (150, 'Golurk', '/assets/images/sets/150.png', 111.80, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (151, 'Terrakion', '/assets/images/sets/151.png', 60.28, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (152, 'Altaria', '/assets/images/sets/152.png', 52.44, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

INSERT INTO pokemon_cards (id, name, image_path, price, stock) VALUES (153, 'Rocky Helmet', '/assets/images/sets/153.png', 10.87, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_path = EXCLUDED.image_path,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;
