-- Fashion Dream Try-On Shop | AI try-on jobs schema snapshot (verified against live schema 2026-10-21)
-- Supabase project: oazipcrbutizdncctkcg | Branch: feature/product-admin
-- Reference only. Storage policies and production migrations remain authoritative.

create table if not exists public.try_on_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 status text not null default 'queued' check (status = any (array['queued','processing','completed','failed'])),
 provider text not null default 'stub', category text not null default 'top' check (category = any (array['top','bottom','dress','outerwear','full_body'])),
 person_image_path text, garment_image_path text, result_image_path text, error text,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists try_on_jobs_status_created_at_idx on public.try_on_jobs(status,created_at);
create index if not exists try_on_jobs_user_id_created_at_idx on public.try_on_jobs(user_id,created_at desc);
create or replace function public.set_try_on_jobs_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
create trigger try_on_jobs_set_updated_at before update on public.try_on_jobs for each row execute function public.set_try_on_jobs_updated_at();
alter table public.try_on_jobs enable row level security;
create policy "Users can read their own try-on jobs" on public.try_on_jobs for select to authenticated using ((select auth.uid())=user_id);
-- Client-side INSERT/UPDATE are intentionally not allowed; server-side job processing owns writes.
-- Provider credentials remain server-side; table stores job state and storage paths only.