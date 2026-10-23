import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const files = {
  cart: new URL("src/lib/cart.tsx", root),
  cartServer: new URL("src/lib/cart.server.functions.ts", root),
  order: new URL("src/lib/orders/order.functions.ts", root),
  checkout: new URL("src/routes/checkout.tsx", root),
  cancel: new URL("src/lib/orders/order-cancel.functions.ts", root),
  migration: new URL("supabase/migrations/20260919030000_phase_b_c_commerce_hardening.sql", root),
  fulfillment: new URL("supabase/migrations/20260919031000_phase_c_fulfillment_hardening.sql", root),
  cancelMigration: new URL("supabase/migrations/20260919032000_phase_c_customer_cancel_order.sql", root),
  rbacFinal: new URL("supabase/migrations/20260919032500_phase_b_rbac_completion.sql", root),
  securityFinal: new URL("supabase/migrations/20260919033500_phase_b_c_security_and_commerce_final.sql", root),
};

let failed = false;
function pass(message) { console.log(`PASS ${message}`); }
function fail(message) { failed = true; console.error(`FAIL ${message}`); }
async function source(path, label) {
  try { return await readFile(path, "utf8"); }
  catch (error) { fail(`${label}: ${error instanceof Error ? error.message : String(error)}`); return ""; }
}
function mustContain(text, needle, label) { if (text.includes(needle)) pass(label); else fail(`${label} (missing ${needle})`); }

const [cart, cartServer, order, checkout, cancel, migration, fulfillment, cancelMigration, rbacFinal, securityFinal] = await Promise.all([
  source(files.cart, "cart.tsx"), source(files.cartServer, "cart.server.functions.ts"), source(files.order, "order.functions.ts"),
  source(files.checkout, "checkout.tsx"), source(files.cancel, "order-cancel.functions.ts"), source(files.migration, "Phase B/C migration"),
  source(files.fulfillment, "fulfillment migration"), source(files.cancelMigration, "customer cancel migration"),
  source(files.rbacFinal, "RBAC completion migration"), source(files.securityFinal, "security completion migration"),
]);

mustContain(cart, "getServerCart", "authenticated cart loads from server");
mustContain(cart, "addServerCartItem", "authenticated cart writes to server");
mustContain(cart, "LEGACY_GUEST_STORAGE_KEY", "legacy guest cart migration exists");
mustContain(cartServer, "supabaseUserRequest", "customer cart uses RLS-enforced Supabase requests");
mustContain(order, "p_idempotency_key", "checkout forwards idempotency key");
mustContain(order, "rpc/create_order_atomic_v2", "checkout uses atomic database transaction");
mustContain(checkout, "wearo_checkout_idempotency_key", "checkout persists idempotency key across retries");
mustContain(checkout, "cancelCustomerOrder", "payment initialization failure releases reservation");
mustContain(cancel, "rpc/cancel_my_order", "customer cancellation is server-side");
mustContain(migration, "ENABLE ROW LEVEL SECURITY", "Phase B enables RLS");
mustContain(migration, "has_backoffice_role", "Phase B defines role hierarchy");
mustContain(migration, "orders_idempotency_key_uidx", "Phase C protects duplicate orders");
mustContain(fulfillment, "trg_orders_enforce_transition", "Phase C enforces fulfillment transitions");
mustContain(fulfillment, "stock=stock+v_item.quantity", "cancelled orders restore inventory");
mustContain(cancelMigration, "cancel_my_order", "customer cancellation RPC is deployed");
mustContain(rbacFinal, "handle_new_user_role", "new users receive customer role");
mustContain(rbacFinal, "update_order_status_as_manager", "manager order operations are scoped to status transitions");
mustContain(securityFinal, "REVOKE ALL ON FUNCTION public.create_order_atomic_v2", "direct checkout RPC is not publicly executable");
mustContain(securityFinal, "GRANT EXECUTE ON FUNCTION public.create_order_atomic_v2", "service role can execute atomic checkout");
mustContain(securityFinal, "v_requested_variants", "checkout rejects missing variants instead of partial orders");

if (failed) process.exit(1);
console.log("\nPhase B/C Integration Guards: PASS");