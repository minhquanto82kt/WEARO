-- Fashion Dream Try-On Shop | payments / payment_events schema snapshot (verified against live schema 2026-10-21)
-- Supabase project: oazipcrbutizdncctkcg | Branch: feature/product-admin
-- Reference only. Existing production migrations remain authoritative.

create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 method text not null check (method = any (array['cod','vietqr','momo'])),
 status text not null default 'pending' check (status = any (array['pending','paid','failed','refunded'])),
 amount integer not null check (amount >= 0), transaction_ref text, provider text, provider_transaction_id text,
 paid_at timestamptz, failure_reason text, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(order_id)
);
create table if not exists public.payment_events (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
 event_type text not null check (event_type = any (array['created','status_changed','provider_update','refund'])),
 old_status text check (old_status is null or old_status = any (array['pending','paid','failed','refunded'])),
 new_status text check (new_status is null or new_status = any (array['pending','paid','failed','refunded'])),
 amount integer check (amount is null or amount >= 0), transaction_ref text, provider_transaction_id text,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), provider text, provider_event_id text
);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_transaction_ref_idx on public.payments(transaction_ref) where transaction_ref is not null;
create index if not exists payments_provider_transaction_id_idx on public.payments(provider_transaction_id) where provider_transaction_id is not null;
create unique index if not exists payments_provider_transaction_id_uidx on public.payments(provider,provider_transaction_id) where provider is not null and provider_transaction_id is not null;
create index if not exists payment_events_payment_id_idx on public.payment_events(payment_id,created_at desc);
create index if not exists payment_events_provider_tx_idx on public.payment_events(provider_transaction_id) where provider_transaction_id is not null;
create unique index if not exists payment_events_provider_event_id_uidx on public.payment_events(provider,provider_event_id) where provider is not null and provider_event_id is not null;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
create policy "payments select by backoffice" on public.payments for select to authenticated using ((select has_backoffice_role('manager'::app_role)));
create policy "payments_admin_update" on public.payments for update to authenticated using ((select is_admin())) with check ((select is_admin()));
create policy "payment_events_admin_select" on public.payment_events for select to authenticated using ((select is_admin()));
-- Payment audit and order-status synchronization triggers are documented in 008_backend_functions.sql.