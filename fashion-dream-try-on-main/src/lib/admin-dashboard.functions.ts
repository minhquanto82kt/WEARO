import { createServerFn } from "@tanstack/react-start";
import { supabaseRequest } from "./supabase.server";

type DashboardContext = { accessToken: string };

function getServerConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Thiếu cấu hình Supabase trên server.");
  return { url, secretKey };
}

async function requireAdmin(accessToken: string) {
  const token = accessToken.trim();
  if (!token) throw new Error("UNAUTHORIZED");

  const { url, secretKey } = getServerConfig();
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: secretKey, Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) throw new Error("UNAUTHORIZED");

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("UNAUTHORIZED");

  const admins = await supabaseRequest<Array<{ user_id: string }>>(
    `admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
    { method: "GET" },
  );
  if (!admins.length) throw new Error("FORBIDDEN");
}

function vietnamTodayStart() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return new Date(`${date}T00:00:00+07:00`).toISOString();
}

export type AdminDashboardStats = {
  products: number;
  publishedProducts: number;
  ordersToProcess: number;
  pendingPayments: number;
  revenueToday: number;
  outOfStockProducts: number;
  journalPublished: number;
  journalDraft: number;
  journalScheduled: number;
};

export const getAdminDashboardStats = createServerFn({ method: "POST" })
  .validator((data: DashboardContext) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);

    const todayStart = vietnamTodayStart();

    const [products, processOrders, pendingPayments, todayPaidOrders, variants, journal] =
      await Promise.all([
        supabaseRequest<Array<{ id: string; status: string }>>(
          "products?select=id,status",
          { method: "GET" },
        ),
        supabaseRequest<Array<{ id: string }>>(
          "orders?select=id&order_status=in.(new,confirmed)",
          { method: "GET" },
        ),
        supabaseRequest<Array<{ id: string }>>(
          "orders?select=id&payment_status=eq.pending",
          { method: "GET" },
        ),
        supabaseRequest<Array<{ total: number }>>(
          `orders?select=total&payment_status=eq.paid&created_at=gte.${encodeURIComponent(todayStart)}`,
          { method: "GET" },
        ),
        supabaseRequest<Array<{ product_id: string; stock: number }>>(
          "product_variants?select=product_id,stock",
          { method: "GET" },
        ),
        supabaseRequest<Array<{ status: string }>>(
          "journal_articles?select=status",
          { method: "GET" },
        ),
      ]);

    const variantsByProduct = new Map<string, number[]>();
    for (const variant of variants) {
      const stocks = variantsByProduct.get(variant.product_id) ?? [];
      stocks.push(Number(variant.stock) || 0);
      variantsByProduct.set(variant.product_id, stocks);
    }

    const outOfStockProducts = products.filter((product) => {
      const stocks = variantsByProduct.get(product.id);
      return stocks !== undefined && stocks.length > 0 && stocks.every((stock) => stock <= 0);
    }).length;

    return {
      products: products.length,
      publishedProducts: products.filter((product) => product.status === "published").length,
      ordersToProcess: processOrders.length,
      pendingPayments: pendingPayments.length,
      revenueToday: todayPaidOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
      outOfStockProducts,
      journalPublished: journal.filter((article) => article.status === "published").length,
      journalDraft: journal.filter((article) => article.status === "draft").length,
      journalScheduled: journal.filter((article) => article.status === "scheduled").length,
    } satisfies AdminDashboardStats;
  });
