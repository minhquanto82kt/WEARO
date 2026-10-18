/**
 * UpThink Supabase helpers
 *
 * Browser-safe helpers for catalog/auth and the admin product UI.
 * Admin mutations are delegated to server functions so the browser never performs privileged writes.
 */

import {
  archiveAdminProduct,
  createAdminProduct,
  createAdminProductImage,
  createAdminProductVariant,
  deleteAdminProductImage,
  deleteAdminProductVariant,
  listAdminInventory,
  listAdminProductImages,
  listAdminProductVariants,
  setPrimaryAdminProductImage,
  updateAdminProduct,
  updateAdminProductImage,
  updateAdminProductVariant,
} from "@/lib/product-admin.functions";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() as string | undefined;

if (!SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL. Add it to the Vercel Preview environment variables.");
if (!SUPABASE_KEY) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY. Add it to the Vercel Preview environment variables.");

export const supabaseConfig = { url: SUPABASE_URL, key: SUPABASE_KEY };

export type Session = { access_token: string; refresh_token?: string; expires_in?: number; expires_at?: number; token_type?: string; user?: { id: string; email?: string } };
const SESSION_KEY = "upthink_admin_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.sessionStorage.getItem(SESSION_KEY); return raw ? (JSON.parse(raw) as Session) : null; } catch { return null; }
}
export function setSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (!session) window.sessionStorage.removeItem(SESSION_KEY); else window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function headers(extra?: Record<string, string>) {
  const session = getSession();
  return { apikey: supabaseConfig.key, Authorization: `Bearer ${session?.access_token ?? supabaseConfig.key}`, "Content-Type": "application/json", ...extra };
}
async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = text || `Request failed (${response.status})`;
    try { const json = JSON.parse(text); message = json.message || json.error_description || json.error || json.hint || message; } catch {}
    throw new Error(message);
  }
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return text as T; }
}

function requireAccessToken() {
  const token = getSession()?.access_token?.trim();
  if (!token) throw new Error("Phiên admin đã hết hạn. Vui lòng đăng nhập lại.");
  return token;
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${supabaseConfig.url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: supabaseConfig.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await parseResponse<Session>(response); setSession(data); return data;
}
export async function signOut() {
  const session = getSession();
  if (session?.access_token) { try { await fetch(`${supabaseConfig.url}/auth/v1/logout`, { method: "POST", headers: headers() }); } catch {} }
  setSession(null);
}
export async function getUser() { return parseResponse<{ id: string; email?: string }>(await fetch(`${supabaseConfig.url}/auth/v1/user`, { headers: headers() })); }
export async function checkAdmin() { return parseResponse<boolean>(await fetch(`${supabaseConfig.url}/rest/v1/rpc/is_admin`, { method: "POST", headers: headers(), body: JSON.stringify({}) })); }

export type Product = {
  id: string; name: string; slug: string; description: string | null; short_description: string | null; long_description: string | null;
  price: number; category: string; image: string | null; active: boolean; status: "draft" | "published" | "archived"; featured: boolean; new_arrival?: boolean; fashion_style?: string | null; created_at: string; updated_at: string;
};
export type ProductImage = { id?: string; product_id: string; image_url: string; alt_text?: string | null; sort_order: number; is_primary: boolean };
export type ProductVariant = { id: string; product_id: string; size: string; color: string; sku: string | null; stock: number; created_at: string };
export type InventoryRow = ProductVariant & { product: Product };

export async function listProductVariants(productId: string) {
  return listAdminProductVariants({ data: { accessToken: requireAccessToken(), productId } });
}
export async function listInventoryRows(): Promise<InventoryRow[]> {
  return listAdminInventory({ data: { accessToken: requireAccessToken() } });
}
export async function createProductVariant(payload: { product_id: string; size: string; color: string; sku?: string | null; stock?: number }) {
  return createAdminProductVariant({ data: { accessToken: requireAccessToken(), productId: payload.product_id, size: payload.size, color: payload.color, sku: payload.sku, stock: payload.stock } });
}
export async function updateProductVariant(id: string, payload: { size?: string; color?: string; sku?: string | null; stock?: number }) {
  return updateAdminProductVariant({ data: { accessToken: requireAccessToken(), id, ...payload } });
}
export async function deleteProductVariant(id: string) {
  await deleteAdminProductVariant({ data: { accessToken: requireAccessToken(), id } });
}

export async function listProductImages(productId: string) {
  return listAdminProductImages({ data: { accessToken: requireAccessToken(), productId } });
}
export async function updateProductImage(id: string, payload: Partial<Pick<ProductImage, "alt_text" | "sort_order" | "is_primary">>) {
  return updateAdminProductImage({ data: { accessToken: requireAccessToken(), id, altText: payload.alt_text, sortOrder: payload.sort_order, isPrimary: payload.is_primary } });
}
export async function deleteProductImage(id: string) {
  await deleteAdminProductImage({ data: { accessToken: requireAccessToken(), id } });
}
export async function setPrimaryProductImage(productId: string, imageId: string) {
  return setPrimaryAdminProductImage({ data: { accessToken: requireAccessToken(), productId, imageId } });
}

export async function getProduct(id: string) {
  const url = `${supabaseConfig.url}/rest/v1/products?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;
  const data = await parseResponse<Product[]>(await fetch(url, { headers: headers() })); return data[0] ?? null;
}
export async function listProducts() {
  const url = `${supabaseConfig.url}/rest/v1/products?select=*&order=created_at.desc`;
  return parseResponse<Product[]>(await fetch(url, { headers: headers() }));
}
export async function createProduct(payload: Partial<Product> & { name: string; slug: string; price: number; category: string }) {
  return createAdminProduct({ data: { accessToken: requireAccessToken(), product: payload } });
}
export async function updateProduct(id: string, payload: Partial<Product>) {
  return updateAdminProduct({ data: { accessToken: requireAccessToken(), id, product: payload } });
}
/**
 * Kept for compatibility with existing admin detail code.
 * Product removal is now an archive operation; transaction history must not be destroyed.
 */
export async function deleteProduct(id: string) {
  return archiveAdminProduct({ data: { accessToken: requireAccessToken(), id } });
}

export async function uploadProductImage(productId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${productId}/${Date.now()}-${randomId}.${extension}`;
  const response = await fetch(`${supabaseConfig.url}/storage/v1/object/product-images/${path}`, { method: "POST", headers: { apikey: supabaseConfig.key, Authorization: `Bearer ${requireAccessToken()}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" }, body: file });
  await parseResponse<unknown>(response);
  return `${supabaseConfig.url}/storage/v1/object/public/product-images/${path}`;
}
export async function addProductImage(productId: string, imageUrl: string, isPrimary: boolean, sortOrder = 0) {
  return createAdminProductImage({ data: { accessToken: requireAccessToken(), productId, imageUrl, isPrimary, sortOrder } });
}
