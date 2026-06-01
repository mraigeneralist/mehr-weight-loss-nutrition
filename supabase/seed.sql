-- =============================================================
-- Mehr Nutrition — Nutrition & Wellness E-commerce — Schema, RLS, Seed
-- Run this entire file once in the Supabase SQL Editor.
-- Re-running is mostly safe: schema uses IF NOT EXISTS / OR REPLACE
-- and seed data uses ON CONFLICT.
-- =============================================================

-- ----- Extensions -----
create extension if not exists "pgcrypto" with schema "public";

-- ----- Profiles -----
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth.user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ----- Categories -----
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0
);

-- ----- Products -----
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  slug text unique not null,
  name text not null,
  description text,
  price_paise int not null check (price_paise >= 0),
  weight_grams int,
  stock int not null default 100 check (stock >= 0),
  image_url text,
  gallery_image_urls text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Idempotent: also add the gallery column to a previously-created table
alter table public.products
  add column if not exists gallery_image_urls text[] not null default '{}';

-- ----- Addresses -----
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false
);

-- ----- Orders -----
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null default 'created'
    check (status in ('created','paid','shipped','delivered','cancelled','failed')),
  subtotal_paise int not null,
  shipping_paise int not null default 0,
  total_paise int not null,
  address_snapshot jsonb not null,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ----- Order items -----
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_snapshot text not null,
  price_paise_snapshot int not null,
  quantity int not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Drop-and-recreate so re-running is idempotent
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles admin read all"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories: public read, admin write
drop policy if exists "categories public read" on public.categories;
drop policy if exists "categories admin write" on public.categories;
create policy "categories public read"
  on public.categories for select
  using (true);
create policy "categories admin write"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- Products: public read (active OR admin), admin write
drop policy if exists "products public read" on public.products;
drop policy if exists "products admin all" on public.products;
create policy "products public read"
  on public.products for select
  using (is_active = true or public.is_admin());
create policy "products admin all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Addresses: only the owner
drop policy if exists "addresses owner all" on public.addresses;
create policy "addresses owner all"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Orders: customer reads own, admin reads all, admin can update status
drop policy if exists "orders read own or admin" on public.orders;
drop policy if exists "orders admin update" on public.orders;
create policy "orders read own or admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());
create policy "orders admin update"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- Order items: same visibility as parent order; reads only.
drop policy if exists "order_items read own or admin" on public.order_items;
create policy "order_items read own or admin"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Note: order/order_item INSERTs are performed by the server route using the
-- service-role key, which bypasses RLS. No insert policy is required.

-- =============================================================
-- Storage: product-images bucket policies
-- IMPORTANT: First create the bucket via Supabase Dashboard:
--   Storage → "New bucket" → name: product-images, public: ON
-- Then run the policies below.
-- =============================================================
drop policy if exists "product-images public read" on storage.objects;
drop policy if exists "product-images admin insert" on storage.objects;
drop policy if exists "product-images admin update" on storage.objects;
drop policy if exists "product-images admin delete" on storage.objects;

create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product-images admin insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images admin update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- =============================================================
-- Seed data: 5 categories x 33 Herbalife/wellness products
-- Re-runnable thanks to ON CONFLICT (slug).
-- image_url / gallery point at local assets in public/ (served by Next).
-- Prices are the owner's MRP (public/product-mrp.jpeg), stored as paise.
-- Keep in sync with lib/seed-data.ts.
--
-- All text literals use dollar-quoted strings ($t$...$t$) so no
-- apostrophe, em-dash, or smart-quote in any clipboard or editor can
-- break them.
-- =============================================================
insert into public.categories (slug, name, description, image_url, sort_order) values
  ($t$weight-management$t$, $t$Weight Management$t$, $t$Meal-replacement shakes and herbal support to manage weight the healthy way.$t$, $t$/products/2.webp$t$, 0),
  ($t$daily-wellness$t$, $t$Daily Wellness$t$, $t$Everyday nutrition - multivitamins, fibre, digestive and immune support.$t$, $t$/products/6.webp$t$, 1),
  ($t$targeted-health$t$, $t$Targeted Health$t$, $t$Focused support for heart, brain, bones, eyes, sleep and more.$t$, $t$/products/18.webp$t$, 2),
  ($t$sports-energy$t$, $t$Sports & Energy$t$, $t$H24 hydration and recovery for active bodies and athletes.$t$, $t$/products/23.webp$t$, 3),
  ($t$skin-care$t$, $t$Skin Care & Beauty$t$, $t$Collagen boosters and a daily facial routine for healthy, glowing skin.$t$, $t$/products/25.webp$t$, 4)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

-- Weight Management
insert into public.products (category_id, slug, name, description, price_paise, weight_grams, stock, image_url, gallery_image_urls) values
  ((select id from public.categories where slug = $t$weight-management$t$), $t$formula-1-nutritional-shake$t$, $t$Formula 1 Nutritional Shake Mix$t$,
    $t$The healthy meal in a glass. A balanced shake with 19 vitamins & minerals, 9 g protein and fibre - just 220 calories per serving. Available in 10 flavours from Mango to Kulfi.$t$,
    217900, 500, 100, $t$/products/2.webp$t$, array[$t$/product-info/formula-1.jpeg$t$]),
  ((select id from public.categories where slug = $t$weight-management$t$), $t$personalized-protein-powder$t$, $t$Personalized Protein Powder$t$,
    $t$A soy & whey protein blend that helps control hunger and build lean muscle. Provides all 9 essential amino acids - add a scoop to your Formula 1 shake.$t$,
    129500, 200, 100, $t$/products/3.webp$t$, array[$t$/product-info/protein.jpeg$t$]),
  ((select id from public.categories where slug = $t$weight-management$t$), $t$shakemate$t$, $t$ShakeMate$t$,
    $t$A milk & soy-based protein drink mix that makes your Formula 1 shake creamier and tastier. Low GI, lower lactose, no added sugar - with calcium and vitamin D.$t$,
    65300, 550, 100, $t$/products/4.webp$t$, array[$t$/product-info/shakemate.jpeg$t$]),
  ((select id from public.categories where slug = $t$weight-management$t$), $t$cell-u-loss$t$, $t$Cell-U-Loss$t$,
    $t$A herbal tablet that supports healthy fluid balance and helps reduce bloating, with electrolyte minerals - corn silk, dandelion, parsley and potassium.$t$,
    170500, null, 100, $t$/products/8.webp$t$, array[$t$/product-info/cell-u-lose.jpeg$t$]),
  ((select id from public.categories where slug = $t$weight-management$t$), $t$herbal-control$t$, $t$Herbal Control$t$,
    $t$A metabolism and energy booster with antioxidants from green, black and oolong tea. Helps improve alertness and supports weight management alongside diet and exercise.$t$,
    343300, null, 100, $t$/products/9.webp$t$, array[$t$/product-info/herbal-control.jpeg$t$])
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_paise = excluded.price_paise,
  weight_grams = excluded.weight_grams, image_url = excluded.image_url,
  gallery_image_urls = excluded.gallery_image_urls, category_id = excluded.category_id;

-- Daily Wellness
insert into public.products (category_id, slug, name, description, price_paise, weight_grams, stock, image_url, gallery_image_urls) values
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$afresh-energy-drink-mix$t$, $t$Afresh Energy Drink Mix$t$,
    $t$A refreshing low-calorie energy drink (just 4 calories) with green tea and natural caffeine for alertness. Enjoy hot or cold in 7 flavours - Lemon, Ginger, Tulsi and more.$t$,
    81200, 50, 100, $t$/products/1.webp$t$, array[$t$/product-info/afresh.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$dinoshake-childrens-drink$t$, $t$Dinoshake Children's Nutritional Drink$t$,
    $t$A tasty nutritional drink mix for kids that supports healthy growth, bones and energy. Good-quality protein with vitamins A, C, D & E, calcium and iron. Chocolate & Strawberry.$t$,
    111500, 200, 100, $t$/products/5.webp$t$, array[$t$/product-info/kids-nurtition.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$formula-2-multivitamin$t$, $t$Formula 2 Multivitamin Complex$t$,
    $t$A daily multivitamin, mineral and herbal tablet that supports energy, immunity and bone health. With vitamins A, C, D, E, B-complex, calcium, iron, zinc and selenium.$t$,
    200400, null, 100, $t$/products/6.webp$t$, array[$t$/product-info/multivitamin.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$cell-activator$t$, $t$Cell Activator$t$,
    $t$An antioxidant tablet with alpha lipoic acid and aloe vera that supports nutrient absorption and cellular energy production - for vitality and healthy aging.$t$,
    221500, null, 100, $t$/products/7.webp$t$, array[$t$/product-info/cell-activator.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$aloe-plus$t$, $t$Aloe Plus$t$,
    $t$Aloe vera capsules that support healthy digestion, soothe the stomach and aid nutrient absorption - helping maintain digestive balance naturally.$t$,
    105900, null, 100, $t$/products/10.webp$t$, array[$t$/product-info/digestive-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$activated-fiber$t$, $t$Activated Fibre$t$,
    $t$Dietary fibre tablets that help you feel full longer, support gut health and healthy blood-sugar levels. A blend of oat, citrus, pea and soluble fibre.$t$,
    163600, null, 100, $t$/products/11.webp$t$, array[$t$/product-info/digestive-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$active-fiber-complex$t$, $t$Active Fibre Complex$t$,
    $t$An unflavoured fibre powder that adds daily fibre to any drink - supports digestion, satiety and weight management with citrus fibre and inulin.$t$,
    255900, null, 100, $t$/products/12.webp$t$, array[$t$/product-info/digestive-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$simply-probiotic$t$, $t$Simply Probiotic$t$,
    $t$A convenient probiotic powder with clinically studied Bacillus coagulans that supports a healthy gut microbiome, digestion and immunity. No added sugar.$t$,
    220900, null, 100, $t$/products/13.webp$t$, array[$t$/product-info/digestive-health-2.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$herbal-aloe-concentrate$t$, $t$Herbal Aloe Concentrate$t$,
    $t$A refreshing aloe vera drink concentrate to mix with water. Supports healthy digestion, soothes the stomach and helps maintain hydration. Low calorie.$t$,
    269600, null, 100, $t$/products/14.webp$t$, array[$t$/product-info/digestive-health-2.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$triphala$t$, $t$Triphala$t$,
    $t$The classic Ayurvedic blend of Amla, Haritaki and Bibhitaki. Supports digestion, regular bowel movements, natural detox and overall wellbeing.$t$,
    108900, null, 100, $t$/products/29.webp$t$, array[$t$/product-info/digestive-health-2.jpeg$t$]),
  ((select id from public.categories where slug = $t$daily-wellness$t$), $t$immune-health$t$, $t$Immune Health$t$,
    $t$An Ayurvedic-inspired tablet with Tulsi, Kalmegh and Katuki that supports natural immune function and respiratory wellness through seasonal changes. Vegetarian.$t$,
    152800, null, 100, $t$/products/27.webp$t$, array[$t$/product-info/immune-health.jpeg$t$])
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_paise = excluded.price_paise,
  weight_grams = excluded.weight_grams, image_url = excluded.image_url,
  gallery_image_urls = excluded.gallery_image_urls, category_id = excluded.category_id;

-- Targeted Health
insert into public.products (category_id, slug, name, description, price_paise, weight_grams, stock, image_url, gallery_image_urls) values
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$calcium-tablets$t$, $t$Herbalife Calcium Tablets$t$,
    $t$Calcium, magnesium and vitamin D tablets that help maintain strong bones and healthy teeth, and support muscle and nerve function - ideal for active adults and women.$t$,
    120300, null, 100, $t$/products/15.webp$t$, array[$t$/product-info/bone-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$joint-support$t$, $t$Joint Support$t$,
    $t$Glucosamine tablets that help maintain healthy joint function, comfort and flexibility - supporting cartilage and reducing stiffness during daily activity.$t$,
    245500, null, 100, $t$/products/16.webp$t$, array[$t$/product-info/bone-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$herbalifeline$t$, $t$Herbalifeline$t$,
    $t$Highly purified marine lipid capsules rich in Omega-3 fatty acids (EPA & DHA) that help maintain a healthy cardiovascular system and normal triglyceride levels.$t$,
    266700, null, 100, $t$/products/17.webp$t$, array[$t$/product-info/heart-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$beta-heart$t$, $t$Beta Heart$t$,
    $t$A natural vanilla powder with 3 g of oat beta-glucan per serving that helps maintain healthy blood cholesterol levels. No added sugar - single-serve, on-the-go.$t$,
    224200, null, 100, $t$/products/18.webp$t$, array[$t$/product-info/heart-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$niteworks$t$, $t$Niteworks$t$,
    $t$A refreshing lemon-flavour powder with L-Arginine that helps produce nitric oxide overnight to support cardiovascular and circulatory health. With vitamins C, E and folic acid.$t$,
    712800, null, 100, $t$/products/19.webp$t$, array[$t$/product-info/heart-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$womens-choice$t$, $t$Woman's Choice$t$,
    $t$Soy isoflavone and chasteberry tablets that support women's hormonal balance and comfort through monthly cycles and menopause - plant-derived daily wellness.$t$,
    124500, null, 100, $t$/products/20.webp$t$, array[$t$/product-info/women-halth.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$male-factor-plus$t$, $t$Male Factor +$t$,
    $t$Fenugreek, pine bark extract and L-Citrulline tablets that support male vitality, healthy circulation and stamina - designed for adult men above 25.$t$,
    341000, null, 100, $t$/products/21.webp$t$, array[$t$/product-info/mens-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$ocular-defense$t$, $t$Ocular Defense$t$,
    $t$Lutein and zeaxanthin capsules that support healthy eyesight and macular health, protecting eyes from oxidative and blue-light stress - for those on screens all day.$t$,
    192700, null, 100, $t$/products/22.webp$t$, array[$t$/product-info/eye-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$sleep-enhancer$t$, $t$Sleep Enhancer$t$,
    $t$A caffeine-free nighttime drink with saffron extract (Affron) and vitamin B6 that helps improve sleep quality and supports calm - wake up refreshed. Vegan & gluten free.$t$,
    169700, null, 100, $t$/products/26.webp$t$, array[$t$/product-info/sleep-enhance.jpeg$t$]),
  ((select id from public.categories where slug = $t$targeted-health$t$), $t$brain-health$t$, $t$Brain Health$t$,
    $t$Brahmi (Bacopa monnieri) tablets that support memory, focus and concentration - traditionally used in Ayurveda for cognitive performance and mental alertness.$t$,
    146400, null, 100, $t$/products/28.webp$t$, array[$t$/product-info/brain-health.jpeg$t$])
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_paise = excluded.price_paise,
  weight_grams = excluded.weight_grams, image_url = excluded.image_url,
  gallery_image_urls = excluded.gallery_image_urls, category_id = excluded.category_id;

-- Sports & Energy
insert into public.products (category_id, slug, name, description, price_paise, weight_grams, stock, image_url, gallery_image_urls) values
  ((select id from public.categories where slug = $t$sports-energy$t$), $t$h24-hydrate$t$, $t$H24 Hydrate$t$,
    $t$A low-calorie electrolyte drink that replenishes minerals lost through sweat and supports endurance and energy metabolism with B vitamins. Convenient sachets for any workout.$t$,
    163600, null, 100, $t$/products/h24-hydrate/img1.jpg$t$, array[$t$/products/h24-hydrate/img2.jpg$t$, $t$/products/h24-hydrate/img4.jpg$t$, $t$/products/h24-hydrate/img5.jpg$t$, $t$/products/h24-hydrate/img3.jpg$t$]),
  ((select id from public.categories where slug = $t$sports-energy$t$), $t$h24-rebuild-strength$t$, $t$H24 Rebuild Strength$t$,
    $t$A post-workout recovery shake with 24-25 g protein, BCAAs and L-glutamine that helps rebuild muscle and reduce soreness after strength training and intense exercise.$t$,
    261600, null, 100, $t$/products/24.webp$t$, array[$t$/product-info/sports-nutrition.jpeg$t$])
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_paise = excluded.price_paise,
  weight_grams = excluded.weight_grams, image_url = excluded.image_url,
  gallery_image_urls = excluded.gallery_image_urls, category_id = excluded.category_id;

-- Skin Care & Beauty
insert into public.products (category_id, slug, name, description, price_paise, weight_grams, stock, image_url, gallery_image_urls) values
  ((select id from public.categories where slug = $t$skin-care$t$), $t$skin-booster$t$, $t$HN Skin Booster$t$,
    $t$An orange-flavour collagen powder with vitamins A, C, E and biotin that helps improve skin elasticity, hydration and glow - and supports healthy hair and nails.$t$,
    391000, null, 100, $t$/products/25.webp$t$, array[$t$/product-info/skin-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$skin-care$t$), $t$facial-cleanser$t$, $t$Facial Cleanser$t$,
    $t$A gentle daily cleanser with jojoba beads, aloe vera and vitamins B3, C & E that removes dirt, oil and makeup, leaving skin clean, smooth and refreshed.$t$,
    116500, null, 100, $t$/products/30.webp$t$, array[$t$/product-info/skin-health.jpeg$t$]),
  ((select id from public.categories where slug = $t$skin-care$t$), $t$facial-toner$t$, $t$Facial Toner$t$,
    $t$An alcohol-free toner with aloe vera, mandarin citrus extracts and vitamins B3, C & E that refreshes skin and preps it to better absorb serum and moisturizer. All skin types.$t$,
    132200, null, 100, $t$/products/31.webp$t$, array[$t$/product-info/skin-health-2.jpeg$t$]),
  ((select id from public.categories where slug = $t$skin-care$t$), $t$moisturizer$t$, $t$Moisturizer$t$,
    $t$A lightweight daily moisturizer with aloe vera, macadamia and olive oils that delivers deep hydration - clinically shown to improve skin softness and luminosity in 7 days.$t$,
    147300, null, 100, $t$/products/32.webp$t$, array[$t$/product-info/skin-health-2.jpeg$t$]),
  ((select id from public.categories where slug = $t$skin-care$t$), $t$facial-serum$t$, $t$Facial Serum$t$,
    $t$A concentrated serum with peptides, botanical extracts and vitamins B3, C & E that helps reduce fine lines, brighten and firm skin for a fresh, youthful glow.$t$,
    302200, null, 100, $t$/products/33.webp$t$, array[$t$/product-info/skin-health-2.jpeg$t$])
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price_paise = excluded.price_paise,
  weight_grams = excluded.weight_grams, image_url = excluded.image_url,
  gallery_image_urls = excluded.gallery_image_urls, category_id = excluded.category_id;
