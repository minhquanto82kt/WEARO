-- Fashion Dream Try-On Shop
-- Database schema snapshot: core product catalog (verified against live schema 2026-10-21)
-- Source: Supabase project oazipcrbutizdncctkcg
-- Branch: feature/product-admin
--
-- IMPORTANT:
-- This is a version-controlled schema reference reconstructed from the
-- current database. It is NOT a production migration and must not be
-- executed blindly against the existing Supabase project.
-- Existing production migration history remains the source of truth.

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  price integer not null constraint products_price_check check (price >= 0) constraint products_price_minimum_1000 check (price >= 1000),
  category text not null,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  slug text not null,
  short_description text,
  long_description text,
  status text not null default 'draft',
  featured boolean not null default false,
  updated_at timestamptz not null default now(),
  new_arrival boolean not null default false,
  fashion_style text constraint products_fashion_style_check check (fashion_style is null or fashion_style = any (array['Casual','Basic','Streetwear','Outing Style']))
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  sku text unique,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists products_slug_unique on public.products (slug);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_featured_idx on public.products (featured) where featured = true;
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary on public.product_images (product_id) where is_primary = true;

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- Current production RLS state verified against pg_policies on 2026-09-22.
-- Public catalog exposure is limited to active + published products.
-- Admin mutations use the backoffice role helper, not frontend claims.
create policy "public can read active products"
  on public.products for select to anon, authenticated
  using (active = true and status = 'published');

create policy "admins can insert products"
  on public.products for insert to authenticated
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can update products"
  on public.products for update to authenticated
  using (has_backoffice_role('admin'::app_role))
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can delete products"
  on public.products for delete to authenticated
  using (has_backoffice_role('admin'::app_role));

create policy "public can read product variants"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and p.active = true
        and p.status = 'published'
    )
  );

create policy "admins can insert product variants"
  on public.product_variants for insert to authenticated
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can update product variants"
  on public.product_variants for update to authenticated
  using (has_backoffice_role('admin'::app_role))
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can delete product variants"
  on public.product_variants for delete to authenticated
  using (has_backoffice_role('admin'::app_role));

create policy "public can read active product images"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.active = true
        and p.status = 'published'
    )
  );

create policy "admins can insert product images"
  on public.product_images for insert to authenticated
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can update product images"
  on public.product_images for update to authenticated
  using (has_backoffice_role('admin'::app_role))
  with check (has_backoffice_role('admin'::app_role));

create policy "admins can delete product images"
  on public.product_images for delete to authenticated
  using (has_backoffice_role('admin'::app_role));
