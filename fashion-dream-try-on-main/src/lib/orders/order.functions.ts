import { createServerFn } from "@tanstack/react-start";
import { supabaseRequest, type SupabaseRequestError } from "../supabase.server";
import { supabaseUserRequest } from "../supabase-user.server";
import { createRequestId, fetchWithTimeoutAndRetry } from "../server-reliability";

type OrderItemInput = { variantId: string; quantity: number };
type CreateOrderInput = { customerName: string; phone: string; email?: string; address: string; city: string; district: string; paymentMethod: "cod" | "vietqr" | "momo" | "mastercard"; items: OrderItemInput[]; accessToken?: string; idempotencyKey?: string };
export type CustomerOrder = { id: string; order_code: string; customer_name: string; phone: string; email: string | null; address: string; city: string; district: string; payment_method: string; payment_status: string; order_status: string; subtotal: number; shipping_fee: number; total: number; note: string | null; created_at: string; user_id?: string | null; voucher_id?: string | null; voucher_code?: string | null; discount_amount?: number };
export type CustomerOrderItem = { id: string; order_id: string; product_id: string; product_name: string; size: string; color: string; quantity: number; unit_price: number; variant_id: string | null; created_at: string };
export type CustomerOrderDetail = CustomerOrder & { items: CustomerOrderItem[] };
type AuthUser = { id: string; email?: string };
function createOrderCode() { const date = new Date().toISOString().slice(0, 10).replaceAll("-", ""); return `FD-${date}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
function getSupabaseAuthConfig() { const url = process.env.SUPABASE_URL; const secretKey = process.env.SUPABASE_SECRET_KEY; if (!url || !secretKey) throw new Error("Thiếu cấu hình Supabase trên server."); return { url, secretKey }; }
async function resolveCustomerFromToken(accessToken: string): Promise<AuthUser> { const token = accessToken.trim(); if (!token) throw new Error("UNAUTHORIZED"); const { url, secretKey } = getSupabaseAuthConfig(); const response = await fetchWithTimeoutAndRetry(`${url}/auth/v1/user`, { headers: { apikey: secretKey, Authorization: `Bearer ${token}` } }, { requestId: createRequestId() }); if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED"); if (!response.ok) throw new Error(`Không thể xác minh phiên đăng nhập (${response.status})`); const user = (await response.json()) as AuthUser; if (!user?.id) throw new Error("UNAUTHORIZED"); return user; }
export async function listCustomerOrdersByToken(accessToken: string, options?: { limit?: number; offset?: number }) { const user = await resolveCustomerFromToken(accessToken); const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100); const offset = Math.max(options?.offset ?? 0, 0); const select = "id,order_code,customer_name,phone,email,address,city,district,payment_method,payment_status,order_status,subtotal,shipping_fee,total,note,created_at,user_id,voucher_id,voucher_code,discount_amount"; const rows = await supabaseUserRequest<CustomerOrder[]>(`orders?user_id=eq.${encodeURIComponent(user.id)}&select=${select}&order=created_at.desc&limit=${limit}&offset=${offset}`, accessToken); return rows.filter((row) => Boolean(row?.id)); }
export async function getCustomerOrderByToken(accessToken: string, orderIdOrCode: string): Promise<CustomerOrderDetail | null> { const user = await resolveCustomerFromToken(accessToken); const key = orderIdOrCode.trim(); if (!key) return null; const select = "id,order_code,customer_name,phone,email,address,city,district,payment_method,payment_status,order_status,subtotal,shipping_fee,total,note,created_at,user_id,voucher_id,voucher_code,discount_amount"; let orders = await supabaseUserRequest<CustomerOrder[]>(`orders?id=eq.${encodeURIComponent(key)}&select=${select}&limit=1`, accessToken); if (!orders.length) orders = await supabaseUserRequest<CustomerOrder[]>(`orders?order_code=eq.${encodeURIComponent(key)}&select=${select}&limit=1`, accessToken); const order = orders[0]; if (!order || order.user_id !== user.id) return null; const items = await supabaseUserRequest<CustomerOrderItem[]>(`order_items?order_id=eq.${encodeURIComponent(order.id)}&select=*&order=created_at.asc`, accessToken); return { ...order, items }; }
export const createOrder = createServerFn({ method: "POST" }).validator((data: CreateOrderInput) => data).handler(async ({ data }) => {
  if (!data.items?.length) throw new Error("Giỏ hàng đang trống.");
  if (!data.customerName?.trim() || !data.phone?.trim() || !data.address?.trim() || !data.city?.trim() || !data.district?.trim()) throw new Error("Vui lòng nhập đầy đủ thông tin giao hàng.");
  if (!["cod", "vietqr", "momo", "mastercard"].includes(data.paymentMethod)) throw new Error("Phương thức thanh toán không hợp lệ.");
  for (const item of data.items) {
    if (!item.variantId) throw new Error("Thông tin biến thể sản phẩm trong giỏ hàng không hợp lệ.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Số lượng sản phẩm không hợp lệ.");
  }

  const variantIds = Array.from(new Set(data.items.map((item) => item.variantId)));
  const encodedVariantIds = variantIds.map((id) => encodeURIComponent(id)).join(",");
  const variants = await supabaseRequest<{ id: string; product_id: string; size: string; color: string; stock: number }[]>(
    `product_variants?id=in.(${encodedVariantIds})&select=id,product_id,size,color,stock`,
  );
  if (variants.length !== variantIds.length) throw new Error("Một hoặc nhiều biến thể trong giỏ hàng không còn tồn tại.");

  const productIds = Array.from(new Set(variants.map((variant) => variant.product_id)));
  const encodedProductIds = productIds.map((id) => encodeURIComponent(id)).join(",");
  const products = await supabaseRequest<{ id: string; active: boolean; status: string }[]>(
    `products?id=in.(${encodedProductIds})&select=id,active,status`,
  );
  const productById = new Map(products.map((product) => [product.id, product]));
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  const orderItems = data.items.map((item) => {
    const variant = variantById.get(item.variantId);
    const product = variant ? productById.get(variant.product_id) : undefined;
    if (!variant || !product || !product.active || product.status !== "published") {
      throw new Error("Một sản phẩm trong giỏ hàng không còn khả dụng.");
    }
    return {
      productId: variant.product_id,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      quantity: item.quantity,
    };
  });

  let verifiedUserId: string | null = null;
  if (data.accessToken?.trim()) verifiedUserId = (await resolveCustomerFromToken(data.accessToken)).id;
  const orderCode = createOrderCode();
  const idempotencyKey = data.idempotencyKey?.trim() || undefined;
  const body: Record<string, unknown> = { p_order_code: orderCode, p_customer_name: data.customerName.trim(), p_phone: data.phone.trim(), p_email: data.email?.trim() || null, p_address: data.address.trim(), p_city: data.city.trim(), p_district: data.district.trim(), p_payment_method: data.paymentMethod, p_items: orderItems, p_note: null, p_user_id: verifiedUserId, p_idempotency_key: idempotencyKey ?? null };
  try { const result = await supabaseRequest<{ order_id: string; order_code: string; total: number }[]>("rpc/create_order_atomic_v2", { method: "POST", body: JSON.stringify(body) }); const order = result[0]; if (!order) throw new Error("Không thể tạo đơn hàng."); let total = order.total; let voucher: { total: number; discount: number; voucher_code: string | null } | null = null; if (verifiedUserId) { const applied = await supabaseRequest<{ total: number; discount: number; voucher_code: string | null }[]>("rpc/apply_best_member_voucher", { method: "POST", body: JSON.stringify({ p_order_id: order.order_id, p_user_id: verifiedUserId }) }); voucher = applied[0] ?? null; if (voucher) total = voucher.total; } return { orderId: order.order_id, orderCode: order.order_code, total, discount: voucher?.discount ?? 0, voucherCode: voucher?.voucher_code ?? null, mock: false, customerType: verifiedUserId ? "member" : "guest" }; } catch (error) { if ((error as SupabaseRequestError)?.status === 409) throw new Error("Đơn hàng đã được tạo trước đó."); throw error; }
});
export const listMyOrders = createServerFn({ method: "POST" }).validator((data: { accessToken: string; limit?: number; offset?: number }) => data).handler(async ({ data }) => { try { return { orders: await listCustomerOrdersByToken(data.accessToken, { limit: data.limit, offset: data.offset }) }; } catch (error) { if (error instanceof Error && error.message === "UNAUTHORIZED") throw new Error("Vui lòng đăng nhập để xem lịch sử đơn hàng."); throw error; } });
export const getMyOrder = createServerFn({ method: "POST" }).validator((data: { accessToken: string; orderIdOrCode: string }) => data).handler(async ({ data }) => { try { const order = await getCustomerOrderByToken(data.accessToken, data.orderIdOrCode); if (!order) throw new Error("Không tìm thấy đơn hàng."); return { order }; } catch (error) { if (error instanceof Error && error.message === "UNAUTHORIZED") throw new Error("Vui lòng đăng nhập để xem đơn hàng."); throw error; } });
