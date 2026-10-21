-- Fashion Dream Try-On Shop | orders / order_items schema snapshot (verified against live schema 2026-10-21)
-- Supabase project: oazipcrbutizdncctkcg | Branch: feature/product-admin
-- Reference only. Existing production migrations remain authoritative.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), order_code text not null unique,
  customer_name text not null, phone text not null, email text, address text not null,
  city text not null, district text not null,
  payment_method text not null check (payment_method = any (array['cod','vietqr','momo'])),
  payment_status text not null default 'pending' check (payment_status = any (array['pending','paid','failed','refunded'])),
  order_status text not null default 'new' check (order_status = any (array['new','confirmed','shipping','completed','cancelled'])),
  subtotal integer not null check (subtotal >= 0), shipping_fee integer not null default 0 check (shipping_fee >= 0),
  total integer not null check (total >= 0), note text, created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  idempotency_key text,
  voucher_id uuid references public.vouchers(id),
  voucher_code text,
  discount_amount integer not null default 0
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null, product_name text not null, size text not null, color text not null,
  quantity integer not null check (quantity > 0), unit_price integer not null check (unit_price >= 0),
  created_at timestamptz not null default now(), variant_id uuid references public.product_variants(id) on delete set null
);
create index if not exists orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_order_code_idx on public.orders(order_code);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_variant_id_idx on public.order_items(variant_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "orders select by owner or backoffice" on public.orders for select to authenticated using ((select auth.uid()) = user_id or (select has_backoffice_role('staff'::app_role)));
create policy "admins can update orders" on public.orders for update to authenticated using ((select is_admin())) with check ((select is_admin()));
create policy "order items select by owner or backoffice" on public.order_items for select to authenticated using ((select has_backoffice_role('staff'::app_role)) or exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = (select auth.uid()) or (select is_admin()))));
-- Customer order creation is handled by the existing atomic order RPC, not public direct INSERT.