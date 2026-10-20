import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Gift, History, Sparkles, WandSparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getCustomerSession } from "@/lib/auth";
import { getMemberDashboard } from "@/lib/member.functions";

export const Route = createFileRoute("/membership")({ component: MembershipPage });

type Dashboard = Awaited<ReturnType<typeof getMemberDashboard>>;

function formatDiscount(voucher: Dashboard["vouchers"][number]) {
  return voucher.discount_type === "percent" ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString("vi-VN")}đ`;
}

function MembershipPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const session = getCustomerSession();
    if (!session?.access_token) {
      setLoading(false);
      setError("Đăng nhập tài khoản để mở Loyalty Plan của bạn.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setDashboard(await getMemberDashboard({ data: { accessToken: session.access_token } }));
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Không thể tải quyền lợi thành viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const onAuth = () => void load();
    window.addEventListener("upthink:auth:login", onAuth);
    window.addEventListener("upthink:auth:logout", onAuth);
    return () => {
      window.removeEventListener("upthink:auth:login", onAuth);
      window.removeEventListener("upthink:auth:logout", onAuth);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#171717]">
      <SiteNav />
      <main>
        <section className="border-b border-[#54728C]/15 px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#54728C]">WEARO / LOYALTY PLAN</p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[-.05em] sm:text-7xl lg:text-8xl">Mua sắm càng lâu, WEARO càng hiểu bạn.</h1>
                <p className="mt-7 max-w-2xl text-sm leading-7 text-[#4b4b4b] sm:text-base">Tài khoản thành viên không chỉ để lưu đơn hàng. WEARO dùng lịch sử mua sắm để mở rộng quyền lợi, gợi ý sản phẩm phù hợp hơn và đưa AI vào trải nghiệm cá nhân hóa.</p>
              </div>
              <div className="border-l-2 border-[#54728C] pl-6">
                <p className="text-xs font-semibold leading-6 text-[#4b4b4b]">GUEST → BASIC</p>
                <p className="mt-2 text-2xl font-bold">MEMBER → LOYALTY</p>
                <p className="mt-2 text-sm leading-6 text-[#666]">AI Virtual Try-On + AI Stylist + Voucher + Lịch sử mua hàng + đề xuất theo hành vi mua sắm.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              [Sparkles, "AI Virtual Try-On", "Thử sản phẩm trên ảnh của bạn với pipeline AI của WEARO."],
              [WandSparkles, "AI Stylist", "Nhận đề xuất outfit theo phong cách, dịp sử dụng và nhu cầu."],
              [Gift, "Nhiều voucher hơn", "Tài khoản thành viên có khu vực voucher riêng thay vì ưu đãi rời rạc."],
              [History, "Lịch sử mua hàng", "Theo dõi đơn đã mua và dùng dữ liệu đó để cá nhân hóa đề xuất."],
            ].map(([Icon, title, description]) => (
              <article key={String(title)} className="border border-[#54728C]/15 bg-white/50 p-6">
                <Icon className="h-6 w-6 text-[#54728C]" strokeWidth={1.5} />
                <h2 className="mt-7 text-lg font-bold uppercase tracking-tight">{String(title)}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5b5b5b]">{String(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#54728C]/15 bg-white/45 px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {loading ? <p className="text-sm text-[#666]">Đang tải Loyalty Plan…</p> : error ? (
              <div className="flex flex-col gap-5 border border-[#54728C]/15 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#54728C]">MEMBER ACCESS</p><p className="mt-2 text-lg font-semibold">{error}</p></div>
                <Link to="/account" className="inline-flex items-center gap-2 bg-[#54728C] px-5 py-3 text-xs font-bold uppercase tracking-[.14em] text-white">Đăng nhập / đăng ký <ArrowRight size={15} /></Link>
              </div>
            ) : dashboard ? (
              <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#54728C]">YOUR LOYALTY PROFILE</p>
                  <h2 className="mt-3 text-4xl font-black uppercase tracking-[-.04em]">{dashboard.user.email ?? "WEARO MEMBER"}</h2>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="border border-[#54728C]/15 p-4"><strong className="text-2xl">{dashboard.purchaseStats.orderCount}</strong><span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-[#666]">Đơn hàng</span></div>
                    <div className="border border-[#54728C]/15 p-4"><strong className="text-2xl">{dashboard.purchaseStats.paidOrderCount}</strong><span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-[#666]">Đã thanh toán</span></div>
                    <div className="border border-[#54728C]/15 p-4"><strong className="text-2xl">{dashboard.claimedVouchers.filter((item) => item.status === "available").length}</strong><span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-[#666]">Voucher</span></div>
                  </div>
                  <Link to="/account/orders" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#54728C]">Xem lịch sử mua hàng <ArrowRight size={14} /></Link>
                </div>

                <div>
                  <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#54728C]">MEMBER VOUCHERS</p><h2 className="mt-2 text-2xl font-bold">Voucher dành riêng cho tài khoản</h2></div><span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#777]">REAL DATA</span></div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {dashboard.vouchers.map((voucher) => {
                      const claimed = dashboard.claimedVouchers.some((item) => item.voucher_id === voucher.id && item.status === "available");
                      return <article key={voucher.id} className="border border-[#54728C]/15 bg-[#f6f1e8] p-5"><div className="flex items-start justify-between gap-3"><span className="text-2xl font-black">{formatDiscount(voucher)}</span><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#54728C]">{claimed ? "ĐÃ NHẬN" : "THÀNH VIÊN"}</span></div><h3 className="mt-4 text-sm font-bold">{voucher.title}</h3><p className="mt-2 text-xs leading-5 text-[#666]">{voucher.description}</p><p className="mt-3 text-[9px] uppercase tracking-[.1em] text-[#888]">Đơn tối thiểu {voucher.min_order_value.toLocaleString("vi-VN")}đ</p></article>;
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {dashboard ? <section className="px-6 py-12 sm:px-10 lg:px-16"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#54728C]">BASED ON PURCHASE HISTORY</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-.04em]">Gợi ý cho lần mua tiếp theo</h2></div><Link to="/shop" className="text-xs font-bold uppercase tracking-[.14em] text-[#54728C]">Xem shop <ArrowRight size={14} className="ml-1 inline" /></Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{dashboard.recommendations.map((product) => <Link key={product.id} to="/product/$id" params={{ id: product.id }} className="group border border-[#54728C]/15 bg-white/50 p-4"><div className="aspect-[4/5] overflow-hidden bg-[#e8e0d5]"><img src={product.image ?? "/brand/wearo-logo-header.svg"} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="pt-4"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#54728C]">{product.category}</p><h3 className="mt-2 font-semibold">{product.name}</h3><p className="mt-2 text-xs text-[#666]">{product.reason}</p><p className="mt-3 text-sm font-bold">{product.price.toLocaleString("vi-VN")}đ</p></div></Link>)}</div></div></section> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
