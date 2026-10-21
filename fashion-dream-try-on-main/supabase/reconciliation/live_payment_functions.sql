-- LIVE DATABASE FUNCTION SNAPSHOT
-- Project: oazipcrbutizdncctkcg
-- Branch source: feature/product-admin
-- Purpose: source-control snapshot for reconciliation only.
-- DO NOT apply directly to production. Review grants/policies first.
-- HISTORICAL / PARTIAL SNAPSHOT (originally captured before the 2026-10-21 audit).
-- The current live catalog exposes create_order_atomic_v2; this file contains an older
-- create_order_atomic definition and is NOT the authoritative current function body.
-- Do not execute this file or use it to recreate production functions without comparing
-- exact current function definitions, grants, dependencies, and caller behavior.

create or replace function public.create_order_atomic(
  p_order_code text,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_city text,
  p_district text,
  p_payment_method text,
  p_items jsonb,
  p_note text default null
)
returns table(order_id uuid, order_code text, total integer)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_input jsonb;
  v_qty integer;
  v_stock integer;
  v_item_qty integer;
  v_price integer;
  v_product_name text;
  v_subtotal integer := 0;
  v_shipping_fee integer;
  v_total integer;
  v_order_id uuid;
  v_variant record;
begin
  if coalesce(trim(p_order_code), '') = '' or coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' or coalesce(trim(p_city), '') = '' or coalesce(trim(p_district), '') = '' then
    raise exception 'Thông tin đơn hàng bắt buộc không được để trống.' using errcode = '22023';
  end if;
  if p_payment_method not in ('cod','vietqr','momo') then
    raise exception 'Phương thức thanh toán không hợp lệ.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Đơn hàng phải có ít nhất một sản phẩm.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Đơn hàng vượt quá số lượng sản phẩm cho phép.' using errcode = '22023';
  end if;

  for v_input in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_input) <> 'object' or coalesce(trim(v_input->>'productId'), '') = '' or coalesce(trim(v_input->>'size'), '') = '' or coalesce(trim(v_input->>'color'), '') = '' then
      raise exception 'Dữ liệu sản phẩm không hợp lệ.' using errcode = '22023';
    end if;
    begin
      v_qty := (v_input->>'quantity')::integer;
    exception when invalid_text_representation then
      raise exception 'Số lượng sản phẩm không hợp lệ.' using errcode = '22023';
    end;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Số lượng sản phẩm phải lớn hơn 0.' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.product_id = trim(v_input->>'productId')
        and lower(trim(pv.size)) = lower(trim(v_input->>'size'))
        and lower(trim(pv.color)) = lower(trim(v_input->>'color'))
        and p.active = true
    ) then
      raise exception 'Không tìm thấy biến thể đang bán: % / % / %.', trim(v_input->>'productId'), trim(v_input->>'size'), trim(v_input->>'color') using errcode = 'P0001';
    end if;
  end loop;

  for v_variant in
    select pv.id, pv.product_id, pv.size, pv.color
    from public.product_variants pv
    where pv.id in (
      select distinct pv2.id
      from jsonb_array_elements(p_items) e
      join public.product_variants pv2
        on pv2.product_id = trim(e.value->>'productId')
       and lower(trim(pv2.size)) = lower(trim(e.value->>'size'))
       and lower(trim(pv2.color)) = lower(trim(e.value->>'color'))
    )
    order by pv.id
  loop
    select pv.stock, p.price, p.name into v_stock, v_price, v_product_name
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_variant.id and p.active = true
    for update of pv, p;

    if not found then
      raise exception 'Biến thể sản phẩm không còn khả dụng.' using errcode = 'P0001';
    end if;

    select coalesce(sum((e.value->>'quantity')::integer), 0) into v_item_qty
    from jsonb_array_elements(p_items) e
    where trim(e.value->>'productId') = v_variant.product_id
      and lower(trim(e.value->>'size')) = lower(trim(v_variant.size))
      and lower(trim(e.value->>'color')) = lower(trim(v_variant.color));

    if v_stock < v_item_qty then
      raise exception 'Sản phẩm % (% / %) chỉ còn % sản phẩm trong kho.', v_product_name, v_variant.size, v_variant.color, v_stock using errcode = 'P0002';
    end if;
    v_subtotal := v_subtotal + (v_price * v_item_qty);
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Tổng tiền sản phẩm không hợp lệ.' using errcode = '22023';
  end if;
  v_shipping_fee := case when v_subtotal >= 1000000 then 0 else 30000 end;
  v_total := v_subtotal + v_shipping_fee;

  insert into public.orders(order_code, customer_name, phone, email, address, city, district, payment_method, payment_status, order_status, subtotal, shipping_fee, total, note)
  values(trim(p_order_code), trim(p_customer_name), trim(p_phone), nullif(trim(coalesce(p_email,'')),''), trim(p_address), trim(p_city), trim(p_district), p_payment_method, 'pending', 'new', v_subtotal, v_shipping_fee, v_total, nullif(trim(coalesce(p_note,'')),''))
  returning id into v_order_id;

  for v_variant in
    select pv.id, pv.product_id, pv.size, pv.color, p.name as product_name, p.price
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id in (
      select distinct pv2.id
      from jsonb_array_elements(p_items) e
      join public.product_variants pv2
        on pv2.product_id = trim(e.value->>'productId')
       and lower(trim(pv2.size)) = lower(trim(e.value->>'size'))
       and lower(trim(pv2.color)) = lower(trim(e.value->>'color'))
    )
    order by pv.id
  loop
    select coalesce(sum((e.value->>'quantity')::integer), 0) into v_item_qty
    from jsonb_array_elements(p_items) e
    where trim(e.value->>'productId') = v_variant.product_id
      and lower(trim(e.value->>'size')) = lower(trim(v_variant.size))
      and lower(trim(e.value->>'color')) = lower(trim(v_variant.color));

    insert into public.order_items(order_id, product_id, product_name, size, color, quantity, unit_price, variant_id)
    values(v_order_id, v_variant.product_id, v_variant.product_name, v_variant.size, v_variant.color, v_item_qty, v_variant.price, v_variant.id);

    update public.product_variants set stock = stock - v_item_qty where id = v_variant.id;
  end loop;

  insert into public.payments(order_id, method, status, amount, provider)
  values(v_order_id, p_payment_method, 'pending', v_total, case when p_payment_method = 'vietqr' then 'sepay' when p_payment_method = 'momo' then 'momo' else 'cod' end);

  return query select v_order_id, trim(p_order_code), v_total;
end;
$$;

create or replace function public.create_payment_for_order(p_order_id uuid)
returns public.payments
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_order public.orders;
  v_payment public.payments;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_method not in ('cod','vietqr','momo') then raise exception 'Unsupported payment method'; end if;
  select * into v_payment from public.payments where order_id = p_order_id;
  if found then return v_payment; end if;
  insert into public.payments(order_id, method, status, amount, provider)
  values (
    v_order.id,
    v_order.payment_method,
    'pending',
    v_order.total,
    case when v_order.payment_method = 'vietqr' then 'sepay' when v_order.payment_method = 'momo' then 'momo' else 'cod' end
  ) returning * into v_payment;
  return v_payment;
end;
$$;

create or replace function public.verify_payment_status(
  p_payment_id uuid,
  p_new_status text,
  p_transaction_ref text default null,
  p_provider_transaction_id text default null,
  p_failure_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_payment public.payments;
  v_result public.payments;
begin
  if p_new_status not in ('pending','paid','failed','refunded') then
    raise exception 'Invalid payment status' using errcode = '22023';
  end if;
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;
  if v_payment.status = p_new_status
     and (p_provider_transaction_id is null or v_payment.provider_transaction_id = p_provider_transaction_id)
     and (p_transaction_ref is null or v_payment.transaction_ref = p_transaction_ref) then
    return v_payment;
  end if;
  if not ((v_payment.status = 'pending' and p_new_status in ('paid','failed')) or (v_payment.status = 'paid' and p_new_status = 'refunded') or (v_payment.status = p_new_status)) then
    raise exception 'Invalid payment state transition: % -> %', v_payment.status, p_new_status using errcode = 'P0001';
  end if;
  update public.payments
  set status = p_new_status,
      transaction_ref = coalesce(nullif(trim(p_transaction_ref), ''), transaction_ref),
      provider_transaction_id = coalesce(nullif(trim(p_provider_transaction_id), ''), provider_transaction_id),
      failure_reason = case when p_new_status = 'failed' then nullif(trim(p_failure_reason), '') else null end,
      paid_at = case when p_new_status = 'paid' then coalesce(paid_at, now()) when p_new_status = 'refunded' then paid_at else null end,
      metadata = coalesce(p_metadata, '{}'::jsonb),
      updated_at = now()
  where id = p_payment_id
  returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.process_momo_payment(
  p_order_code text,
  p_provider_event_id text,
  p_provider_transaction_id text,
  p_transaction_ref text,
  p_amount integer,
  p_result_code integer,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing public.payments;
  v_payment public.payments;
  v_metadata jsonb;
  v_new_status text;
begin
  if nullif(trim(coalesce(p_order_code, '')), '') is null then raise exception 'Missing MoMo order code' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_provider_event_id, '')), '') is null then raise exception 'Missing MoMo provider event id' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_provider_transaction_id, '')), '') is null then raise exception 'Missing MoMo provider transaction id' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid MoMo payment amount' using errcode = '22023'; end if;

  select pay.* into v_existing
  from public.payment_events pe
  join public.payments pay on pay.id = pe.payment_id
  where pe.provider = 'momo' and pe.provider_event_id = trim(p_provider_event_id)
  order by pe.created_at desc limit 1;
  if found then return v_existing; end if;

  select pay.* into v_existing
  from public.payments pay
  where pay.provider = 'momo' and pay.provider_transaction_id = trim(p_provider_transaction_id)
  limit 1 for update;
  if found then
    if v_existing.status = 'paid' and p_result_code = 0 then return v_existing; end if;
    raise exception 'MoMo transaction is already linked to another payment' using errcode = 'P0001';
  end if;

  select pay.* into v_payment
  from public.orders o
  join public.payments pay on pay.order_id = o.id
  where o.order_code = trim(p_order_code) and pay.provider = 'momo' and pay.method = 'momo'
  limit 1 for update;
  if not found then raise exception 'MoMo payment not found for order %', trim(p_order_code) using errcode = 'P0002'; end if;
  if v_payment.amount <> p_amount then raise exception 'Payment amount mismatch: expected %, received %', v_payment.amount, p_amount using errcode = 'P0001'; end if;

  v_new_status := case when p_result_code = 0 then 'paid' else 'failed' end;
  v_metadata := jsonb_build_object('provider','momo','provider_event_id',trim(p_provider_event_id),'provider_transaction_id',trim(p_provider_transaction_id),'order_code',trim(p_order_code),'result_code',p_result_code,'amount',p_amount,'transaction_ref',nullif(trim(coalesce(p_transaction_ref,'')),'')) || coalesce(p_metadata,'{}'::jsonb);

  return public.verify_payment_status(v_payment.id,v_new_status,nullif(trim(coalesce(p_transaction_ref,'')),''),trim(p_provider_transaction_id),case when v_new_status='failed' then coalesce(p_metadata->>'message','MoMo payment failed') else null end,v_metadata);
end;
$$;

create or replace function public.process_sepay_payment(
  p_order_code text,
  p_provider_event_id text,
  p_provider_transaction_id text,
  p_transaction_ref text,
  p_transfer_amount integer,
  p_transfer_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing public.payments;
  v_payment public.payments;
  v_metadata jsonb;
begin
  if nullif(trim(coalesce(p_order_code, '')), '') is null then raise exception 'Missing SePay order code' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_provider_event_id, '')), '') is null then raise exception 'Missing SePay provider event id' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_provider_transaction_id, '')), '') is null then raise exception 'Missing SePay provider transaction id' using errcode = '22023'; end if;
  if p_transfer_amount is null or p_transfer_amount <= 0 then raise exception 'Invalid transfer amount' using errcode = '22023'; end if;
  if lower(trim(coalesce(p_transfer_type, ''))) <> 'in' then raise exception 'Only incoming SePay transactions can verify a payment' using errcode = '22023'; end if;

  select pay.* into v_existing from public.payment_events pe join public.payments pay on pay.id=pe.payment_id where pe.provider='sepay' and pe.provider_event_id=trim(p_provider_event_id) order by pe.created_at desc limit 1;
  if found then return v_existing; end if;
  select * into v_existing from public.payments where provider='sepay' and provider_transaction_id=trim(p_provider_transaction_id) limit 1 for update;
  if found then
    if v_existing.status='paid' then return v_existing; end if;
    raise exception 'SePay transaction is already linked to another payment' using errcode='P0001';
  end if;

  select pay.* into v_payment from public.orders o join public.payments pay on pay.order_id=o.id where o.order_code=trim(p_order_code) and pay.provider='sepay' and pay.method='vietqr' limit 1 for update;
  if not found then raise exception 'SePay payment not found for order %',trim(p_order_code) using errcode='P0002'; end if;
  if v_payment.amount<>p_transfer_amount then raise exception 'Payment amount mismatch: expected %, received %',v_payment.amount,p_transfer_amount using errcode='P0001'; end if;

  v_metadata := jsonb_build_object('provider_event_id',trim(p_provider_event_id),'provider','sepay','order_code',trim(p_order_code),'transfer_type',lower(trim(p_transfer_type)),'transfer_amount',p_transfer_amount,'transaction_ref',nullif(trim(coalesce(p_transaction_ref,'')),'')) || coalesce(p_metadata,'{}'::jsonb);
  return public.verify_payment_status(v_payment.id,'paid',nullif(trim(coalesce(p_transaction_ref,'')),''),trim(p_provider_transaction_id),null,v_metadata);
end;
$$;

-- Current live grants observed during reconciliation:
-- create_order_atomic: postgres, service_role
-- create_payment_for_order: postgres, service_role
-- verify_payment_status: postgres, service_role
-- process_sepay_payment: postgres, service_role
-- process_momo_payment: postgres, anon, authenticated, service_role  <-- SECURITY FINDING
-- is_admin_user: postgres, anon, authenticated, service_role             <-- SECURITY FINDING
-- track_guest_order: postgres, anon, authenticated, service_role
-- is_admin: postgres, authenticated, service_role
-- These grants must be reviewed before this snapshot is ever promoted to a migration.
