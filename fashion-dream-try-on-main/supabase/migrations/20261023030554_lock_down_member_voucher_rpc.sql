-- A member voucher can only be applied by the signed-in owner of the order.
-- The application must call this RPC with the customer's access token, not the service key.
CREATE OR REPLACE FUNCTION public.apply_best_member_voucher(p_order_id uuid, p_user_id uuid)
RETURNS TABLE(total integer, discount integer, voucher_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_order public.orders%rowtype;
  v_voucher record;
  v_discount integer := 0;
  v_total integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn hàng của tài khoản.' USING ERRCODE = '42501';
  END IF;

  IF v_order.voucher_id IS NOT NULL THEN
    RETURN QUERY SELECT v_order.total, v_order.discount_amount, v_order.voucher_code;
    RETURN;
  END IF;

  SELECT v.id, v.code, v.discount_type, v.discount_value, v.min_order_value, v.max_discount
  INTO v_voucher
  FROM public.user_vouchers uv
  JOIN public.vouchers v ON v.id = uv.voucher_id
  WHERE uv.user_id = p_user_id
    AND uv.status = 'available'
    AND v.active = true
    AND v.starts_at <= now()
    AND (v.ends_at IS NULL OR v.ends_at >= now())
    AND v.min_order_value <= v_order.subtotal
    AND (v.usage_limit IS NULL OR v.used_count < v.usage_limit)
  ORDER BY
    CASE
      WHEN v.discount_type = 'percent'
        THEN least(v_order.subtotal * v.discount_value / 100, coalesce(v.max_discount, v_order.subtotal))
      ELSE least(v.discount_value, v_order.subtotal)
    END DESC,
    v.created_at ASC
  LIMIT 1
  FOR UPDATE OF uv;

  IF NOT FOUND THEN
    RETURN QUERY SELECT v_order.total, 0, NULL::text;
    RETURN;
  END IF;

  IF v_voucher.discount_type = 'percent' THEN
    v_discount := least(v_order.subtotal * v_voucher.discount_value / 100, coalesce(v_voucher.max_discount, v_order.subtotal));
  ELSE
    v_discount := least(v_voucher.discount_value, v_order.subtotal);
  END IF;

  v_total := greatest(0, v_order.subtotal + v_order.shipping_fee - v_discount);

  UPDATE public.orders
  SET voucher_id = v_voucher.id,
      voucher_code = v_voucher.code,
      discount_amount = v_discount,
      total = v_total
  WHERE id = p_order_id AND user_id = p_user_id;

  UPDATE public.payments
  SET amount = v_total
  WHERE order_id = p_order_id;

  UPDATE public.user_vouchers
  SET status = 'used', used_at = now()
  WHERE user_id = p_user_id
    AND voucher_id = v_voucher.id
    AND status = 'available';

  UPDATE public.vouchers
  SET used_count = used_count + 1
  WHERE id = v_voucher.id;

  RETURN QUERY SELECT v_total, v_discount, v_voucher.code;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_best_member_voucher(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_best_member_voucher(uuid, uuid) TO authenticated;
