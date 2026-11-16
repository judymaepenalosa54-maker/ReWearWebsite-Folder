-- ReWear: products table setup for Supabase
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.

-- 1) Create the table
create table if not exists products (
  id bigint primary key,
  name text not null,
  category text not null,
  price numeric not null,
  seller text not null,
  image text not null
);

-- 2) Turn on Row Level Security (RLS) so the table is protected
alter table products enable row level security;

-- 3) Allow EVERYONE to read (select) products, but nobody to edit them from the website
create policy "Anyone can read products"
  on products for select
  using (true);

-- 4) Add the 26 products from script.js
insert into products (id, name, category, price, seller, image) values
(1,  'Classic White T-Shirt',  'tops',        150, 'Alex',   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'),
(2,  'Denim Jeans',            'bottoms',     250, 'Jamie',  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'),
(3,  'Casual Dress',           'dresses',     300, 'Taylor', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'),
(4,  'Denim Jacket',           'outerwear',   400, 'Morgan', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'),
(5,  'Everyday Bag',           'accessories', 180, 'Sam',    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'),
(6,  'Black Shirt',            'tops',        120, 'Jordan', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600'),
(7,  'Linen Button-Up Shirt',  'tops',        220, 'Casey',  'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600'),
(8,  'Striped Cotton Blouse',  'tops',        190, 'Riley',  'https://images.unsplash.com/photo-1564257577-7a6f3f6f7f6b?w=600'),
(9,  'Relaxed Chino Trousers', 'bottoms',     280, 'Avery',  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'),
(10, 'Pleated Midi Skirt',     'bottoms',     240, 'Drew',   'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600'),
(11, 'Floral Summer Dress',    'dresses',     320, 'Sky',    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600'),
(12, 'Knit Cardigan',          'outerwear',   350, 'Quinn',  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'),
(13, 'Lightweight Rain Jacket','outerwear',   420, 'Robin',  'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600'),
(14, 'Canvas Tote Bag',        'accessories', 130, 'Lee',    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600'),
(15, 'Classic Leather Belt',   'accessories', 160, 'Reese',  'https://images.unsplash.com/photo-1624222247344-550fb8d4b5f7?w=600'),
(16, 'Vintage Sunglasses',     'accessories', 200, 'Kai',    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'),
(17, 'Soft Cotton Hoodie',     'tops',        300, 'Noah',   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'),
(18, 'Denim Midi Skirt',       'bottoms',     260, 'Mika',   'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'),
(19, 'Vintage Floral Blouse',  'tops',        210, 'Ari',    'https://images.unsplash.com/photo-1564257577-7a6f3f6f7f6b?w=600'),
(20, 'Straight-Leg Jeans',     'bottoms',     290, 'Nico',   'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'),
(21, 'Everyday Summer Dress',  'dresses',     340, 'Sage',   'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600'),
(22, 'Cozy Knit Sweater',      'outerwear',   380, 'Em',     'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'),
(23, 'Small Crossbody Bag',    'accessories', 230, 'Bea',    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'),
(24, 'Weekend Hoodie',         'tops',        320, 'Luis',   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'),
(25, 'Lightweight Jacket',     'outerwear',   450, 'Remy',   'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'),
(26, 'Canvas Shopper Tote',    'accessories', 150, 'Elle',   'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600');
