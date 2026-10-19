import { createServerFn } from "@tanstack/react-start";
import { supabaseRequest } from "../supabase.server";
import { supabaseUserRequest } from "../supabase-user.server";
import { fetchWithTimeoutAndRetry } from "../server-reliability";

type AdminInput = { accessToken: string };
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Order = { [key: string]: JsonValue };

async function requireAdmin(accessToken: string) {
  const token = accessToken.trim();
  if (!token) throw new Error("UNAUTHORIZED");
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Thiếu cấu hình Supabase trên server.");
  const userResponse = await fetchWithTimeoutAndRetry(`${url}/auth/v1/user`, { headers: { apikey: secretKey, Authorization: `Bearer ${token}` } });
  if (!userResponse.ok) throw new Error("UNAUTHORIZED");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("UNAUTHORIZED");
  let allowed = false;
  try { allowed = await supabaseUserRequest<boolean>("rpc/has_backoffice_role", token, { method: "POST", body: JSON.stringify({ required_role: "admin" }) }); } catch { allowed = false; }
  if (!allowed) throw new Error("FORBIDDEN");
  return user.id;
}

function handleAuthError(error: unknown): never {
  if (error instanceof Error && error.message === "UNAUTHORIZED") throw new Error("Phiên quản trị không hợp lệ hoặc đã hết hạn.");
  if (error instanceof Error && error.message === "FORBIDDEN") throw new Error("Bạn không có quyền quản trị đơn hàng.");
  throw error;
}

export const listAdminOrders = createServerFn({ method: "POST" }).validator((data: AdminInput) => data).handler(async ({ data }) => {
  try { await requireAdmin(data.accessToken); return await supabaseRequest<Order[]>("orders?select=*&order=created_at.desc", { method: "GET" }); }
  catch (error) { handleAuthError(error); }
});

export const getAdminOrder = createServerFn({ method: "POST" }).validator((data: AdminInput & { orderId: string }) => data).handler(async ({ data }) => {
  try {
    await requireAdmin(data.accessToken);
    const orderId = data.orderId.trim();
    if (!orderId) throw new Error("Mã đơn hàng không hợp lệ.");
    const [orders, items, payments] = await Promise.all([
      supabaseRequest<Order[]>(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`, { method: "GET" }),
      supabaseRequest<Order[]>(`order_items?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=created_at.asc`, { method: "GET" }),
      supabaseRequest<Order[]>(`payments?order_id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`, { method: "GET" }),
    ]);
    if (!orders.length) return null;
    return { order: orders[0], items, payment: payments[0] ?? null };
  } catch (error) { handleAuthError(error); }
});

export const updateAdminOrderStatus = createServerFn({ method: "POST" }).validator((data: AdminInput & { orderId: string; orderStatus: string }) => data).handler(async ({ data }) => {
  try {
    await requireAdmin(data.accessToken);
    const allowed = new Set(["new", "confirmed", "shipping", "completed", "cancelled"]);
    if (!allowed.has(data.orderStatus)) throw new Error("Trạng thái đơn hàng không hợp lệ.");
    const rows = await supabaseRequest<Order[]>(`orders?id=eq.${encodeURIComponent(data.orderId.trim())}`, { method: "PATCH", body: JSON.stringify({ order_status: data.orderStatus }) });
    if (!rows.length) throw new Error("Không cập nhật được đơn hàng.");
    return rows[0];
  } catch (error) { handleAuthError(error); }
});
