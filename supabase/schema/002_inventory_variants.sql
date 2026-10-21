-- Fashion Dream Try-On Shop
-- Schema reference snapshot: inventory / product variants (verified against live schema 2026-10-21)
-- Supabase project: oazipcrbutizdncctkcg
-- Branch: feature/product-admin
-- IMPORTANT: Reference only. Do not execute blindly against production.

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

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
alter table public.product_variants enable row level security;

create policy "public can read product variants" on public.product_variants for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.active = true and p.status = 'published'));
create policy "admins can insert product variants" on public.product_variants for insert to authenticated with check (has_backoffice_role('admin'::app_role));
create policy "admins can update product variants" on public.product_variants for update to authenticated using (has_backoffice_role('admin'::app_role)) with check (has_backoffice_role('admin'::app_role));
create policy "admins can delete product variants" on public.product_variants for delete to authenticated using (has_backoffice_role('admin'::app_role));

-- Inventory source of truth is product_variants.stock.
-- No separate inventory table is introduced in this MVP snapshot.