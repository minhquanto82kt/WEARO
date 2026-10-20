import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WearoAiAssistant } from "@/components/wearo-ai-assistant";
import { getCustomerUser } from "@/lib/auth";
import { isMockUserMode } from "@/lib/mock-user";

export const Route = createFileRoute("/ai/assistant")({
  head: () => ({
    meta: [
      { title: "WEARO AI Stylist" },
      { name: "description", content: "Trò chuyện với WEARO AI Stylist để khám phá phong cách và outfit phù hợp." },
    ],
  }),
  component: AiAssistantPage,
});

function AiAssistantPage() {
  const [checking, setChecking] = useState(true);
  const [member, setMember] = useState(false);
  const [mock, setMock] = useState(false);

  useEffect(() => {
    let active = true;
    getCustomerUser()
      .then((user) => {
        if (active) { setMember(Boolean(user?.id)); setMock(isMockUserMode()); }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="wearo-ai-phase2 min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="wearo-ai-page">
        <div className="wearo-ai-assistant-shell">
          <div className="wearo-ai-assistant-topbar">
            <div>
              <p className="wearo-ai-kicker">WEARO / AI STYLIST · {mock ? "ADMIN SANDBOX" : "LOYALTY PLAN"}</p>
              <h1 className="wearo-ai-assistant-title wearo-ai-display">Personal Style Assistant</h1>
              <p className="wearo-ai-assistant-lede">
                AI Stylist là quyền lợi của tài khoản WEARO thành viên và Admin Mock Sandbox: tư vấn outfit, màu sắc, form dáng và cách phối đồ theo nhu cầu của bạn.
              </p>
            </div>
            <Link to="/ai" className="wearo-ai-assistant-back">← AI Studio</Link>
          </div>

          {checking ? (
            <section className="wearo-ai-assistant-card p-8" aria-live="polite">
              <p className="wearo-ai-helper">Đang xác minh tài khoản thành viên…</p>
            </section>
          ) : member ? (
            <section className="wearo-ai-assistant-card" aria-label="WEARO AI Stylist chat">
              <div className="wearo-ai-assistant-status">
                <span className="wearo-ai-status-dot" aria-hidden="true" />
                <span>WEARO AI Stylist</span>
                <span className="wearo-ai-status-note">LOYALTY PLAN</span>
              </div>
              <WearoAiAssistant />
            </section>
          ) : (
            <section className="wearo-ai-assistant-card p-8" aria-labelledby="member-stylist-title">
              <p className="wearo-ai-kicker">MEMBER FEATURE</p>
              <h2 id="member-stylist-title" className="wearo-ai-display mt-3 text-3xl">AI Stylist dành cho thành viên</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-silver">Đăng ký tài khoản WEARO để mở Loyalty Plan, sử dụng AI Stylist, nhận voucher thành viên và nhận đề xuất sản phẩm dựa trên lịch sử mua hàng.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/account" className="wearo-ai-generate inline-flex items-center justify-center">Đăng nhập / đăng ký</Link>
                <Link to="/membership" className="inline-flex items-center justify-center border border-[rgba(84,114,140,.22)] px-5 py-3 text-xs font-bold uppercase tracking-[.12em]">Xem Loyalty Plan</Link>
              </div>
            </section>
          )}

          <div className="wearo-ai-assistant-links">
            <span>Virtual Try-On vẫn có thể dùng theo quyền lợi AI của tài khoản.</span>
            <Link to="/ai">Quay lại AI Studio →</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
