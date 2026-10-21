-- Read-only Supabase database audit.
-- Run in a privileged SQL editor/session against the target environment.
-- This script intentionally performs no INSERT/UPDATE/DELETE/DDL.

with expected_tables(schema_name, table_name) as (
  values
    ('public','admin_users'),
    ('public','ai_usage_daily'),
    ('public','appearance_branding'),
    ('public','appearance_palettes'),
    ('public','appearance_themes'),
    ('public','cart_items'),
    ('public','carts'),
    ('public','inventory_movements'),
    ('public','journal_articles'),
    ('public','order_items'),
    ('public','orders'),
    ('public','payment_events'),
    ('public','payments'),
    ('public','product_images'),
    ('public','product_reviews'),
    ('public','product_tags'),
    ('public','product_variants'),
    ('public','product_vision_attributes'),
    ('public','products'),
    ('public','site_branding'),
    ('public','site_content_settings'),
    ('public','site_theme_settings'),
    ('public','tags'),
    ('public','try_on_jobs'),
    ('public','user_roles'),
    ('public','user_vouchers'),
    ('public','vouchers'),
    ('public','wishlist_items')
),
table_checks as (
  select
    e.schema_name,
    e.table_name,
    case when c.oid is not null then 'PASS' else 'FAIL' end as status,
    case when c.oid is not null then 'table exists' else 'missing table' end as detail
  from expected_tables e
  left join pg_class c
    on c.relname = e.table_name
   and c.relnamespace = to_regnamespace(e.schema_name)
   and c.relkind = 'r'
),
rls_checks as (
  select
    e.schema_name,
    e.table_name,
    case when c.relrowsecurity then 'PASS' else 'FAIL' end as status,
    case when c.relrowsecurity then 'RLS enabled' else 'RLS disabled' end as detail
  from expected_tables e
  join pg_class c
    on c.relname = e.table_name
   and c.relnamespace = to_regnamespace(e.schema_name)
   and c.relkind = 'r'
)
select 'table' as check_type, schema_name, table_name, status, detail from table_checks
union all
select 'rls' as check_type, schema_name, table_name, status, detail from rls_checks
order by check_type, table_name;

-- High-value integrity checks.
select
  'products_slug_unique' as check_name,
  case when exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='products_slug_unique'
  ) then 'PASS' else 'FAIL' end as status;

select
  'product_variants_stock_nonnegative' as check_name,
  case when exists (
    select 1
    from pg_constraint
    where conrelid = 'public.product_variants'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%stock%'
      and pg_get_constraintdef(oid) ilike '%>= 0%'
  ) then 'PASS' else 'REVIEW' end as status;

select
  'payments_one_per_order' as check_name,
  case when exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname like 'payments%'
      and indexdef ilike '%unique%'
      and indexdef ilike '%order_id%'
  ) then 'PASS' else 'REVIEW' end as status;

select
  'product_images_one_primary' as check_name,
  case when exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='product_images_one_primary'
  ) then 'PASS' else 'REVIEW' end as status;

select
  'admin_users_is_admin_function' as check_name,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='is_admin'
  ) then 'PASS' else 'FAIL' end as status;

select
  'atomic_order_rpc_present' as check_name,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('create_order_atomic','create_order_atomic_v2')
  ) then 'PASS' else 'REVIEW' end as status;

select
  'payment_verification_rpc_present' as check_name,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='verify_payment_status'
  ) then 'PASS' else 'REVIEW' end as status;

-- Review these results together with pg_policies and storage.objects policies.
-- A PASS here does not prove that the complete live RLS policy set is correct.

-- Live catalog contract checks added 2026-10-21.
select
  'products_minimum_price_1000' as check_name,
  case when exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_price_minimum_1000'
      and pg_get_constraintdef(oid) ilike '%price%1000%'
  ) then 'PASS' else 'FAIL' end as status;

select
  'orders_support_momo' as check_name,
  case when exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_payment_method_check'
      and pg_get_constraintdef(oid) ilike '%momo%'
  ) then 'PASS' else 'FAIL' end as status;

-- Review security-definer RPCs that can be invoked by anon/authenticated.
-- This is intentionally a report query, not an automatic grant mutation.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
order by p.proname;
