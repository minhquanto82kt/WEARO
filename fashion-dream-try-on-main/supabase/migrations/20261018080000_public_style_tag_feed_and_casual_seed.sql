-- WEARO style tags: safe public read endpoint and first CASUAL mapping.
-- This migration uses the existing tags/product_tags model; it does not create duplicate collection tables.

create or replace function public.get_public_product_style_tags()
returns table (
  product_id text,
  tag_slug text,
  tag_name text,
  tag_description text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pt.product_id,
    t.slug as tag_slug,
    t.name as tag_name,
    t.description as tag_description
  from public.product_tags pt
  join public.tags t on t.id = pt.tag_id
  join public.products p on p.id = pt.product_id
  where t.status = 'active'
    and t.archived_at is null
    and p.active = true
    and p.status = 'published'
  order by t.slug, pt.product_id;
$$;

revoke all on function public.get_public_product_style_tags() from public;
grant execute on function public.get_public_product_style_tags() to anon, authenticated;

do $$
declare
  admin_user_id uuid;
  casual_tag_id uuid;
begin
  select au.user_id into admin_user_id
  from public.admin_users au
  order by au.created_at
  limit 1;

  if admin_user_id is null then
    raise exception 'Cannot seed WEARO style tags: no admin_users record exists.';
  end if;

  insert into public.tags (name, slug, description, status, created_by)
  values
    ('Casual', 'casual', 'Trang phục unisex dễ mặc hằng ngày, ưu tiên sự thoải mái và linh hoạt.', 'active', admin_user_id),
    ('Basic', 'basic', 'Những thiết kế tối giản, dễ phối và phù hợp nhiều hoàn cảnh.', 'active', admin_user_id),
    ('Streetwear', 'streetwear', 'Phong cách đường phố với phom dáng và chi tiết cá tính.', 'active', admin_user_id),
    ('Outerwear', 'outerwear', 'Các lớp trang phục khoác ngoài.', 'active', admin_user_id)
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        status = 'active',
        archived_at = null,
        updated_at = now();

  select t.id into casual_tag_id from public.tags t where t.slug = 'casual';

  insert into public.product_tags (product_id, tag_id)
  select p.id, casual_tag_id
  from public.products p
  where p.active = true
    and p.status = 'published'
    and p.id in (
      'product-e112910e-b430-44d9-8705-8ba5019eb123',
      'product-1bc5808c-556f-4203-83b1-da901507fb0e',
      'product-49b38dd7-77b4-42fe-a627-a98ff00e5102',
      'product-ce482074-3252-4656-8adf-a4f6735a870f',
      'shadow-hoodie'
    )
  on conflict (product_id, tag_id) do nothing;
end;
$$;
