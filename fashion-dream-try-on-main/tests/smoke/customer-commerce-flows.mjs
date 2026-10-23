import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const read = (file) => readFile(join(root, file), "utf8");

const [product, cart, checkout, order, auth, history, detail, invoice, account] = await Promise.all([
  read("src/routes/product.$id.tsx"),
  read("src/lib/cart.tsx"),
  read("src/routes/checkout.tsx"),
  read("src/lib/order.functions.ts"),
  read("src/lib/auth.ts"),
  read("src/routes/account/orders.tsx"),
  read("src/routes/account/orders/$id.tsx"),
  read("src/lib/invoice.functions.ts"),
  read("src/routes/account.tsx"),
]);

function mustMatch(text, pattern, label) {
  assert.match(text, pattern, label);
  console.log(`PASS ${label}`);
}

function mustNotMatch(text, pattern, label) {
  assert.doesNotMatch(text, pattern, label);
  console.log(`PASS ${label}`);
}

// Flow 1: Guest Product -> Cart -> Checkout -> COD -> Invoice.
mustMatch(product, /add\(\{\s*variantId:\s*selectedVariant\.id,\s*qty:\s*quantity\s*\}\)/, "guest product adds the selected variant to cart");
mustMatch(cart, /export type CartLine = \{ variantId: string; qty: number/, "cart uses variantId as the canonical line identity");
mustMatch(checkout, /paymentMethod.*"cod"/s, "checkout supports COD as a payment method");
mustMatch(checkout, /createOrder\(\{ data:/, "checkout creates the order through the server order function");
mustMatch(checkout, /paymentMethod,/, "checkout sends the selected payment method");
mustMatch(checkout, /getInvoiceData\(\{\s*data:\s*\{\s*orderCode:\s*result\.orderCode,\s*phone\s*\}\s*\}\)/, "COD checkout fetches the invoice after order creation");
mustMatch(invoice, /const isCod = order\.payment_method === "cod"/, "invoice service explicitly recognizes COD");
mustMatch(invoice, /if \(!isCod && !isPaidOnline\) throw new Error\("INVOICE_NOT_READY"\)/, "invoice is blocked until payment is ready");
mustMatch(checkout, /setCountdown\(5\)/, "success page starts the five-second invoice countdown");
mustMatch(checkout, /const invoiceReady = Boolean\(invoice && countdown === 0\)/, "invoice action stays locked until countdown reaches zero");
mustMatch(checkout, /className="wearo-checkout-success__print"\s+onClick=\{\(\) => void openInvoicePdfClient\(invoice\)\}/s, "invoice opens only from the explicit print button");
mustNotMatch(checkout, /finish\([^)]*\)[\s\S]{0,300}openInvoicePdfClient\(invoice\)/, "invoice is not auto-opened by finish");

console.log("FLOW 1 CONTRACT: Guest Product -> Cart -> Checkout -> COD -> Invoice PASS");

// Flow 2: Member Register -> Login -> Cart -> Order -> History.
mustMatch(auth, /export async function signUpCustomer/, "member registration function exists");
mustMatch(auth, /export async function signInCustomer/, "member login function exists");
mustMatch(auth, /export function getCustomerSession\(\)/, "member session is persisted and readable");
mustMatch(cart, /getServerCart\(\{ data: \{ accessToken: session\.access_token \} \}\)/, "authenticated cart reads from the server cart");
mustMatch(cart, /addServerCartItem\(/, "authenticated cart writes to the server cart");
mustMatch(order, /verifiedUserId = \(await resolveCustomerFromToken\(data\.accessToken\)\)\.id/, "member access token is verified server-side");
mustMatch(order, /p_user_id: verifiedUserId/, "member order is associated with the verified user id");
mustMatch(order, /customerType: verifiedUserId \? "member" : "guest"/, "order creation distinguishes member and guest");
mustMatch(history, /listMyOrders\(\{ data: \{ accessToken: session\.access_token/, "member history loads with the authenticated access token");
mustMatch(history, /to="\/account\/orders\/\$id"/, "member history links to order detail");
mustMatch(detail, /getMyOrder\(\{ data: \{ accessToken: session\.access_token/, "member order detail uses the authenticated access token");
mustMatch(detail, /order\.items\.map/, "member order detail renders persisted order items");
mustMatch(checkout, /memberMode \? "\/account\/orders" : "\/account"/, "member success page links directly to order history");
mustMatch(account, /to="\/account\/orders"/, "member account dashboard exposes order history");

console.log("FLOW 2 CONTRACT: Member Register -> Login -> Cart -> Order -> History PASS");

// Public route reachability for both customer flows.
for (const path of ["/", "/shop", "/cart", "/checkout", "/account", "/account/orders"]) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    if (response.status >= 200 && response.status < 400) {
      console.log(`PASS route ${path} (${response.status})`);
    } else {
      throw new Error(`expected 2xx/3xx, received ${response.status}`);
    }
  } catch (error) {
    console.error(`FAIL route ${path}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.exitCode) process.exit(1);
console.log("\nCustomer commerce flow contracts: PASS");
