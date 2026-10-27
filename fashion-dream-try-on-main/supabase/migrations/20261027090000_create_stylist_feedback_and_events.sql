-- WEARO AI Stylist feedback and conversion attribution.
-- Run through Supabase migrations; service-role writes are server-side only.
create table if not exists public.stylist_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  session_id text not null,
  recommendation_ids text[] not null default '{}',
  helpful boolean not null,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.stylist_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  session_id text not null,
  event_type text not null check (event_type in ('recommendation_view','product_click','add_to_cart','purchase')),
  product_id text null,
  order_id text null,
  recommendation_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stylist_events_type_created_idx
  on public.stylist_events (event_type, created_at desc);
create index if not exists stylist_events_product_created_idx
  on public.stylist_events (product_id, created_at desc);
create index if not exists stylist_feedback_created_idx
  on public.stylist_feedback (created_at desc);

alter table public.stylist_feedback enable row level security;
alter table public.stylist_events enable row level security;
-- Intentionally no anon/authenticated policies: browser clients cannot write or read analytics directly.
-- Server-side writes use SUPABASE_SECRET_KEY and must validate inputs/authentication.
