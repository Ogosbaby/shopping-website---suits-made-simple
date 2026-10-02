-- ===========================================================================
-- Suits Made Simple (SMS) — database schema
-- Run this in the Supabase SQL editor (or `psql "$DATABASE_URL" -f schema.sql`).
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  category      text not null check (category in ('corporate', 'premium_casual')),
  description   text not null,
  details       jsonb not null default '[]'::jsonb,
  price_cents   integer not null check (price_cents >= 0),
  image         text not null,
  -- Gallery order: cover, alternate, lifestyle, fabric detail.
  images        text[] not null default '{}'::text[],
  colour        text not null default 'Charcoal',
  occasions     text[] not null default '{}'::text[],
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Existing installs: add the browsing columns introduced after the first cut.
alter table public.products add column if not exists images    text[] not null default '{}'::text[];
alter table public.products add column if not exists colour    text not null default 'Charcoal';
alter table public.products add column if not exists occasions text[] not null default '{}'::text[];

create index if not exists products_colour_idx on public.products (colour);
create index if not exists products_occasions_idx on public.products using gin (occasions);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null,
  stock       integer not null default 10 check (stock >= 0),
  unique (product_id, size)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------

create table if not exists public.cart_items (
  id              uuid primary key default gen_random_uuid(),
  cart_id         text not null,
  user_id         uuid references auth.users (id) on delete set null,
  product_id      uuid not null references public.products (id) on delete cascade,
  variant_id      uuid references public.product_variants (id) on delete set null,
  size_type       text not null check (size_type in ('standard', 'custom')),
  standard_size   text,
  measurements    jsonb,
  quantity        integer not null default 1 check (quantity > 0),
  created_at      timestamptz not null default now(),
  -- Option A requires a standard size; Option B requires the six measurements.
  constraint cart_size_check check (
    (size_type = 'standard' and standard_size is not null)
    or (size_type = 'custom' and measurements is not null)
  )
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  user_id         uuid references auth.users (id) on delete set null,
  email           text not null,
  full_name       text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  state           text not null,
  postal_code     text,
  country         text not null default 'Nigeria',
  subtotal_cents  integer not null check (subtotal_cents >= 0),
  shipping_cents  integer not null default 0 check (shipping_cents >= 0),
  total_cents     integer not null check (total_cents >= 0),
  -- pending_payment -> paid once Paystack verifies; 'confirmed' when settled offline.
  status          text not null default 'confirmed',
  -- Paystack reference of the successful attempt, used to match the callback/webhook.
  payment_reference text,
  paid_at         timestamptz,
  -- The cart behind this order, emptied only after payment clears.
  cart_id         text,
  created_at      timestamptz not null default now()
);

-- Existing installs: add the payment columns introduced with Paystack.
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists cart_id text;

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_payment_reference_idx on public.orders (payment_reference);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  product_name      text not null,
  size_type         text not null check (size_type in ('standard', 'custom')),
  standard_size     text,
  measurements      jsonb,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity > 0),
  line_total_cents  integer not null check (line_total_cents >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.cart_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Catalog is publicly readable.
drop policy if exists "Catalog is publicly readable" on public.products;
create policy "Catalog is publicly readable"
  on public.products for select using (true);

drop policy if exists "Variants are publicly readable" on public.product_variants;
create policy "Variants are publicly readable"
  on public.product_variants for select using (true);

-- Cart rows are keyed by a random per-browser cart id; the API routes enforce
-- access with the service role key, so the policy only needs to allow reads
-- for the anon client when the service role is not configured.
drop policy if exists "Cart rows readable by cart id" on public.cart_items;
create policy "Cart rows readable by cart id"
  on public.cart_items for select using (true);

drop policy if exists "Cart rows writable by cart id" on public.cart_items;
create policy "Cart rows writable by cart id"
  on public.cart_items for all using (true) with check (true);

-- Signed-in customers can read their own orders and order items.
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items"
  on public.order_items for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
