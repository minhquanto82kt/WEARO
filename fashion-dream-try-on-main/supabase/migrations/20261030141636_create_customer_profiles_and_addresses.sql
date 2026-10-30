create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_profiles_full_name_length check (char_length(btrim(full_name)) <= 120),
  constraint customer_profiles_phone_length check (phone is null or char_length(btrim(phone)) <= 30),
  constraint customer_profiles_birth_date_not_future check (birth_date is null or birth_date <= current_date)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  ward text not null,
  district text not null,
  city text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_recipient_name_length check (char_length(btrim(recipient_name)) between 1 and 120),
  constraint customer_addresses_phone_length check (char_length(btrim(phone)) between 1 and 30),
  constraint customer_addresses_address_line_length check (char_length(btrim(address_line)) between 1 and 300),
  constraint customer_addresses_ward_length check (char_length(btrim(ward)) between 1 and 120),
  constraint customer_addresses_district_length check (char_length(btrim(district)) between 1 and 120),
  constraint customer_addresses_city_length check (char_length(btrim(city)) between 1 and 120)
);

create index customer_addresses_user_created_idx
  on public.customer_addresses (user_id, created_at desc);
create unique index customer_addresses_one_default_per_user_idx
  on public.customer_addresses (user_id)
  where is_default = true;

alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;

revoke all on public.customer_profiles from anon, authenticated;
revoke all on public.customer_addresses from anon, authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;

create policy "Customers can read own profile"
  on public.customer_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Customers can create own profile"
  on public.customer_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Customers can update own profile"
  on public.customer_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Customers can read own addresses"
  on public.customer_addresses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Customers can create own addresses"
  on public.customer_addresses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Customers can update own addresses"
  on public.customer_addresses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Customers can delete own addresses"
  on public.customer_addresses for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_customer_record_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger customer_profiles_set_updated_at
before update on public.customer_profiles
for each row execute function public.set_customer_record_updated_at();

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_customer_record_updated_at();

create or replace function public.handle_new_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_profiles (user_id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_customer_profile() from public, anon, authenticated;

create trigger trg_auth_user_customer_profile
after insert on auth.users
for each row execute function public.handle_new_customer_profile();

insert into public.customer_profiles (user_id, full_name)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    ''
  )
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.set_default_customer_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if not exists (
    select 1
    from public.customer_addresses
    where id = p_address_id and user_id = v_user_id
    for update
  ) then
    raise exception 'Address not found' using errcode = 'P0002';
  end if;

  update public.customer_addresses
  set is_default = false
  where user_id = v_user_id and is_default = true;

  update public.customer_addresses
  set is_default = true
  where id = p_address_id and user_id = v_user_id;
end;
$$;

revoke all on function public.set_default_customer_address(uuid) from public, anon;
grant execute on function public.set_default_customer_address(uuid) to authenticated;
