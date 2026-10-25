import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  generateTryOn,
  getTryOnJob,
  listAiProducts,
} from "@/lib/ai.functions";
import { generateWearoAiReply } from "@/lib/wearo-ai-chat.functions";
import { getStylistRecommendations } from "@/lib/stylist.functions";
import { getCustomerAccessToken } from "@/lib/auth";
import { GROWTH_EVENTS, trackGrowthEvent } from "@/lib/analytics/analytics";

const STYLES = ["Casual", "Basic", "Streetwear", "Outing Style"];
const OCCASIONS = ["Đi học", "Đi làm", "Hẹn hò", "Đi chơi"];
const CONSENT_KEY = "wearo-ai-studio-consent-v2";

function AiLoader({ label }: { label: string }) {
  return (
    <div className="wearo-ai-loader-state" role="status" aria-live="polite">
      <span className="wearo-ai-loader" aria-hidden="true"><span /><span /><span /></span>
      <span>{label}</span>
    </div>
  );
}

type AiProduct = Awaited<ReturnType<typeof listAiProducts>>[number];
type StylistRecommendation = Awaited<ReturnType<typeof getStylistRecommendations>>["recommendations"][number];
type TryOnStatus = "idle" | "uploading" | "processing" | "completed" | "failed";

export const Route = createFileRoute("/ai")({
  validateSearch: (search: Record<string, unknown>): { product?: string; mode?: "concept" | "tryon" } => {
    const parsed: { product?: string; mode?: "concept" | "tryon" } = {};
    if (typeof search["product"] === "string") parsed.product = search["product"];
    if (search["mode"] === "concept" || search["mode"] === "tryon") parsed.mode = search["mode"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "WEARO AI Studio" },
      {
        name: "description",
        content: "WEARO AI Studio — trợ lý AI giúp định hình phong cách và outfit theo cách riêng của bạn.",
      },
    ],
  }),
  component: AiPage,
});

function AiConsent({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const [dataDetailsOpen, setDataDetailsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const rules = [
    ["01", "Ảnh & quyền sử dụng", "Chỉ tải lên hình ảnh bạn có quyền sử dụng. Tránh ảnh riêng tư hoặc ảnh của người khác khi chưa được cho phép."],
    ["02", "Dữ liệu & nhà cung cấp AI", "Ảnh hoặc nội dung bạn gửi được chuyển từ trình duyệt đến dịch vụ WEARO để xử lý; một số tác vụ tiếp tục gửi dữ liệu đến nhà cung cấp AI được cấu hình."],
    ["03", "Kết quả chỉ mang tính tham khảo", "Hình ảnh do AI tạo có thể sai khác về màu sắc, kích thước, chất liệu hoặc phom dáng và không phải cam kết về sản phẩm."],
    ["04", "Thông tin bạn nhập", "Không nhập thông tin nhạy cảm như giấy tờ định danh, thông tin tài chính hoặc dữ liệu riêng tư không cần thiết."],
    ["05", "Sử dụng có trách nhiệm", "Không dùng AI để xâm phạm quyền riêng tư, danh dự, quyền hình ảnh hoặc quyền sở hữu trí tuệ của người khác."],
  ];

  return (
    <main className="wearo-ai-page">
      <style>{`
        .wearo-ai-consent-shell { position: relative; isolation: isolate; width: 100%; box-sizing: border-box; padding: clamp(18px, 3vw, 36px) 16px 48px; }
        .wearo-consent-mosaic { pointer-events: none; position: absolute; inset: 0; overflow: hidden; z-index: 0; }
        .wearo-consent-shape { position: absolute; display: block; opacity: .32; transform: rotate(-12deg); animation: wearo-mosaic-float 13s ease-in-out infinite; }
        .ai-consent-panel.wearo-consent-panel { position: relative; z-index: 1; isolation: isolate; width: min(100%, 900px) !important; max-width: 900px !important; box-sizing: border-box !important; margin: 0 auto; padding: clamp(24px, 3.4vw, 44px) !important; border: 1px solid rgba(84,114,140,.22) !important; border-radius: 4px 4px 20px 20px !important; background: rgba(255,255,255,.97) !important; box-shadow: 0 22px 60px rgba(38,55,70,.08) !important; }
        .ai-consent-panel.wearo-consent-panel h1#ai-consent-title { display: block; max-width: 100% !important; margin-top: 26px !important; color: #263746 !important; font-family: "Bodoni Moda", Georgia, serif !important; font-size: clamp(34px, 4.3vw, 52px) !important; font-weight: 500 !important; line-height: 1.08 !important; letter-spacing: -.025em !important; word-break: normal !important; overflow-wrap: normal !important; writing-mode: horizontal-tb !important; text-orientation: mixed !important; }
        .ai-consent-panel.wearo-consent-panel > p { max-width: 680px !important; margin-top: 16px !important; color: #536979 !important; font-size: 14px !important; line-height: 1.8 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 26px; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule { min-width: 0; min-height: 128px; box-sizing: border-box; border: 1px solid rgba(84,114,140,.22); border-radius: 2px; padding: 18px; background: #fff; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule[data-wide="true"] { grid-column: 1 / -1; min-height: 0; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule[data-accent="blue"] { background: #F0F4F6; border-color: rgba(84,114,140,.34); }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule[data-accent="cream"] { background: #FCF6F0; border-color: rgba(217,187,169,.68); }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule h2 { margin: 1px 0 0; color: #263746 !important; font-size: 12px !important; font-weight: 700 !important; line-height: 1.5 !important; letter-spacing: .055em !important; text-transform: uppercase; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-rule p { margin-top: 7px !important; color: #536373 !important; font-size: 13px !important; line-height: 1.7 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-number { display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid rgba(84,114,140,.4); background: #F8F5F0; color: #36566D; font-size: 11px; font-weight: 700; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-disclosure { min-height: 48px; border-radius: 2px !important; border-color: rgba(84,114,140,.34) !important; background: #fff !important; color: #36566D !important; padding: 12px 15px !important; font-size: 13px !important; line-height: 1.5 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-check { margin-top: 22px !important; border-radius: 2px !important; border-color: rgba(84,114,140,.3) !important; background: #F3F6F7 !important; padding: 16px 18px !important; color: #263746 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-check span { color: #263746 !important; font-size: 13px !important; line-height: 1.7 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-choice { min-height: 48px; border-radius: 2px !important; padding: 13px 18px !important; font-size: 12px !important; font-weight: 700 !important; letter-spacing: .04em !important; text-transform: none !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-primary { background: #54728C !important; color: #fff !important; border: 1px solid #54728C !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-primary:disabled { background: #AAB9C2 !important; color: #fff !important; border-color: #AAB9C2 !important; opacity: 1 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-back { background: #fff !important; color: #36566D !important; border: 1px solid #54728C !important; text-decoration: none !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-back:hover { background: #F2CEAE !important; color: #263746 !important; }
        .ai-consent-panel.wearo-consent-panel .wearo-consent-note { color: #687985 !important; font-size: 11px !important; line-height: 1.65 !important; }
        .wearo-consent-shape:nth-child(1) { width: 96px; height: 96px; top: 7%; left: 4%; background: #F2CEAE; clip-path: polygon(0 0,100% 0,72% 100%,18% 82%); }
        .wearo-consent-shape:nth-child(2) { width: 62px; height: 62px; top: 18%; right: 7%; background: #7794A6; clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%); animation-delay: -3s; }
        .wearo-consent-shape:nth-child(3) { width: 42px; height: 42px; top: 47%; left: 1.5%; background: #D9BBA9; border-radius: 50%; animation-delay: -6s; }
        .wearo-consent-shape:nth-child(4) { width: 110px; height: 72px; top: 63%; right: 2%; background: #54728C; clip-path: polygon(0 12%,82% 0,100% 76%,24% 100%); animation-delay: -4s; }
        .wearo-consent-shape:nth-child(5) { width: 36px; height: 36px; bottom: 8%; left: 12%; background: #F2AD94; transform: rotate(45deg); animation-delay: -2s; }
        .wearo-consent-shape:nth-child(6) { width: 22px; height: 22px; bottom: 15%; right: 15%; border: 2px solid #54728C; border-radius: 50%; animation-delay: -8s; }
        @keyframes wearo-mosaic-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -9px; } }
        /* Panel-specific rules above intentionally override legacy AI consent styling. */
        .wearo-consent-choice { min-height: 46px; transition: background-color .18s ease, border-color .18s ease, color .18s ease, transform .18s ease; }
        .wearo-consent-choice:disabled { cursor: not-allowed; opacity: .5; filter: saturate(.65); }
        .wearo-consent-choice:not(:disabled):hover { transform: translateY(-1px); }
        .wearo-consent-checkbox { accent-color: #54728C; width: 19px; height: 19px; }
        @media (prefers-reduced-motion: reduce) { .wearo-consent-shape { animation: none !important; } .wearo-consent-choice { transition: none !important; } }
        @media (max-width: 700px) {
          .wearo-ai-consent-shell { padding: 14px 12px 32px; }
          .ai-consent-panel.wearo-consent-panel { padding: 24px 20px !important; border-radius: 4px 4px 14px 14px !important; }
          .ai-consent-panel.wearo-consent-panel .wearo-consent-rule-grid { grid-template-columns: minmax(0, 1fr); gap: 10px; margin-top: 20px; }
          .ai-consent-panel.wearo-consent-panel .wearo-consent-rule { min-height: 0; padding: 15px; }
          .ai-consent-panel.wearo-consent-panel h1#ai-consent-title { font-size: clamp(32px, 8vw, 42px) !important; margin-top: 22px !important; }
          .wearo-consent-shape:nth-child(1) { width: 52px; height: 52px; left: -8px; }
          .wearo-consent-shape:nth-child(4) { width: 56px; height: 40px; right: -8px; }
        }
      `}</style>
      <div className="wearo-ai-consent-shell relative">
        <div className="wearo-consent-mosaic" aria-hidden="true">
          <span className="wearo-consent-shape" /><span className="wearo-consent-shape" />
          <span className="wearo-consent-shape" /><span className="wearo-consent-shape" />
          <span className="wearo-consent-shape" /><span className="wearo-consent-shape" />
        </div>
        <section className="ai-consent-panel wearo-consent-panel" aria-labelledby="ai-consent-title">
          <div className="border-b border-[rgba(84,114,140,.22)] pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">WEARO / AI STUDIO · NOTICE</p>
              <span className="inline-flex items-center border border-[#D8B56D] bg-[#FFF4D8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6D4C12]" aria-label="Bản thử nghiệm">BETA</span>
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54728C]">01 · Trước khi bắt đầu</p>
          </div>

          <h1 id="ai-consent-title" className="wearo-ai-display mt-6 text-balance">
            Trước khi bắt đầu
            <span className="mt-1 block text-[#54728C]">WEARO AI Studio</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4B5563]">
            Dùng AI để khám phá outfit hoặc thử đồ ảo. Hãy xem nhanh cách dữ liệu được xử lý và các giới hạn dưới đây trước khi lựa chọn.
          </p>

          <div className="wearo-consent-rule-grid">
            {rules.map(([number, title, description]) => (
              <article key={number} data-wide={number === "01" || number === "02" || number === "05" ? "true" : "false"} data-accent={number === "02" ? "blue" : number === "05" ? "cream" : "plain"} className="wearo-consent-rule group grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3 sm:gap-4">
                <span className="wearo-consent-number">{number}</span>
                <div className="min-w-0">
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className="wearo-consent-disclosure inline-flex min-h-11 items-center justify-between gap-3 border border-[rgba(84,114,140,.34)] bg-white/80 px-4 py-3 text-left text-sm font-semibold text-[#36566D] transition hover:bg-[#F2CEAE]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C]" aria-expanded={dataDetailsOpen} aria-controls="wearo-ai-data-details" onClick={() => setDataDetailsOpen((open) => !open)}>
              <span><span aria-hidden="true">↗ </span>Cách dữ liệu được xử lý</span><span aria-hidden="true">{dataDetailsOpen ? "−" : "+"}</span>
            </button>
            <button type="button" className="wearo-consent-disclosure inline-flex min-h-11 items-center justify-between gap-3 border border-[rgba(84,114,140,.34)] bg-white/80 px-4 py-3 text-left text-sm font-semibold text-[#36566D] transition hover:bg-[#F2CEAE]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C]" aria-expanded={termsOpen} aria-controls="wearo-ai-terms-details" onClick={() => setTermsOpen((open) => !open)}>
              <span><span aria-hidden="true">↗ </span>Điều khoản sử dụng AI</span><span aria-hidden="true">{termsOpen ? "−" : "+"}</span>
            </button>
          </div>

          {dataDetailsOpen ? <section id="wearo-ai-data-details" className="mt-3 border border-[rgba(84,114,140,.28)] bg-[#F7F4EF] p-4 text-sm leading-6 text-[#374151]" aria-label="Thông tin xử lý dữ liệu">
            <h2 className="font-semibold text-[#202B33]">Dữ liệu đi qua những đâu?</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>AI Stylist gửi nội dung yêu cầu đến dịch vụ AI; AI Try-On gửi ảnh người dùng và ảnh sản phẩm qua endpoint xử lý phía máy chủ.</li>
              <li>Dữ liệu có thể được chuyển tới nhà cung cấp AI đang cấu hình cho tác vụ tương ứng.</li>
              <li>Code hiện tại chưa cung cấp đủ căn cứ để xác nhận thời hạn lưu trữ, quy trình xóa ở nhà cung cấp hoặc việc dữ liệu có được dùng để huấn luyện hay không.</li>
              <li>Chỉ tải lên ảnh bạn có quyền sử dụng và tránh nội dung nhạy cảm. Đóng trang không đồng nghĩa với việc xóa dữ liệu đã gửi trước đó.</li>
            </ul>
          </section> : null}

          {termsOpen ? <section id="wearo-ai-terms-details" className="mt-3 border border-[rgba(84,114,140,.28)] bg-[#F7F4EF] p-4 text-sm leading-6 text-[#374151]" aria-label="Điều khoản sử dụng AI">
            <h2 className="font-semibold text-[#202B33]">Nguyên tắc sử dụng</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Bạn cần có quyền sử dụng hình ảnh và nội dung gửi lên.</li>
              <li>Không sử dụng AI để quấy rối, giả mạo, xâm phạm quyền hình ảnh hoặc sở hữu trí tuệ.</li>
              <li>Kết quả AI là gợi ý tham khảo, có thể không phản ánh chính xác sản phẩm thực tế.</li>
              <li>Lựa chọn đồng ý chỉ lưu trạng thái chấp thuận trong bộ nhớ trình duyệt hiện tại; đây không phải hồ sơ chấp thuận được xác nhận ở máy chủ.</li>
            </ul>
          </section> : null}

          <label className={`ai-consent-check mt-5 flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors ${checked ? "border-[#54728C] bg-[rgba(119,148,166,.16)]" : "border-[rgba(84,114,140,.34)] bg-white/85 hover:bg-[rgba(242,206,174,.18)]"}`}>
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="wearo-consent-checkbox mt-1 shrink-0" />
            <span className="text-sm leading-6 text-[#202B33]">
              Tôi đã đọc thông tin trên và đồng ý gửi nội dung/ảnh cần thiết đến dịch vụ WEARO và nhà cung cấp AI được cấu hình để thực hiện tính năng tôi chọn.
            </span>
          </label>
          <p className="mt-2 text-xs leading-5 text-[#4B5563]">Bạn có thể không đồng ý và quay lại trang trước. Không cần chọn ô này để rời trang.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <button type="button" className="wearo-consent-choice wearo-consent-primary inline-flex w-full items-center justify-center gap-2 bg-[#54728C] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3F5F76] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C] focus-visible:ring-offset-2 disabled:hover:bg-[#54728C]" disabled={!checked} onClick={onAccept}>
              Tiếp tục vào AI Studio <span aria-hidden="true">→</span>
            </button>
            <Link to="/" className="wearo-consent-choice wearo-consent-back inline-flex items-center justify-center border border-[#54728C] bg-white px-5 py-3 text-sm font-semibold text-[#36566D] hover:bg-[#F2CEAE]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C] focus-visible:ring-offset-2">
              Không đồng ý · Quay lại
            </Link>
          </div>
          <p className="wearo-consent-note mt-4 text-center text-xs leading-5 text-[#4B5563]">Chi tiết hình học lấy cảm hứng từ bảng màu WEARO, giữ vai trò điểm nhấn nhẹ.</p>
        </section>
      </div>
    </main>
  );
}
function TryOnStudio({
  products,
  initialProductId,
}: {
  products: AiProduct[];
  initialProductId?: string;
}) {
  const [personImage, setPersonImage] = useState("");
  const [personPreview, setPersonPreview] = useState("");
  const [productId, setProductId] = useState(initialProductId ?? products[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [activeJobId, setActiveJobId] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [resultImage, setResultImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialProductId && products.some((product) => product.id === initialProductId)) {
      setProductId(initialProductId);
    } else if (!productId && products[0]) {
      setProductId(products[0].id);
    }
  }, [initialProductId, productId, products]);

  function handlePersonImage(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Ảnh phải là JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Ảnh tối đa 6MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setPersonImage(value);
      setPersonPreview(value);
      setResultImage("");
      setError("");
      setStatus("idle");
    };
    reader.readAsDataURL(file);
  }

  async function waitForResult(jobId: string) {
    setIsPolling(true);
    setError("");
    try {
      for (let attempt = 0; attempt < 24; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const job = await getTryOnJob({ data: { jobId } });
        if (job.status === "completed" && job.image) {
          setResultImage(job.image);
          trackGrowthEvent({ name: GROWTH_EVENTS.AI_RESULT_COMPLETE, productId });
          setStatus("completed");
          setActiveJobId("");
          return;
        }
        setStatus("processing");
      }

      // The provider job remains durable in Supabase; let the shopper resume polling
      // instead of treating a slow provider response as a failed job.
      setStatus("processing");
      setError("Tác vụ vẫn đang xử lý. Bạn có thể bấm “Kiểm tra kết quả” để tiếp tục kiểm tra mà không tạo job mới.");
    } finally {
      setIsPolling(false);
    }
  }

  async function handleTryOn() {
    if (activeJobId && status === "processing" && !isPolling) {
      try {
        await waitForResult(activeJobId);
      } catch (tryOnError) {
        setStatus("failed");
        setError(tryOnError instanceof Error ? tryOnError.message : "Không thể kiểm tra kết quả AI Try-On.");
      }
      return;
    }

    if (!personImage) {
      setError("Hãy tải ảnh toàn thân hoặc ảnh người rõ ràng trước.");
      return;
    }
    if (!productId) {
      setError("Hãy chọn một sản phẩm đã được xuất bản.");
      return;
    }
    const accessToken = getCustomerAccessToken();

    trackGrowthEvent({ name: GROWTH_EVENTS.AI_TRY_ON_START, productId });
    setStatus("uploading");
    setError("");
    setResultImage("");

    try {
      const job = await generateTryOn({
        data: { ...(accessToken ? { accessToken } : {}), personImage, productId, note: note.trim() || undefined },
      });
      setActiveJobId(job.jobId);
      setStatus("processing");
      await waitForResult(job.jobId);
    } catch (tryOnError) {
      setStatus("failed");
      setError(tryOnError instanceof Error ? tryOnError.message : "Không thể thực hiện AI Try-On.");
    }
  }

  return (
    <section className="wearo-ai-card mt-6">
      <div className="wearo-ai-card-header">
        <span className="wearo-ai-card-title">AI Virtual Try-on</span>
        <span className="wearo-ai-kicker">THỬ ĐỒ ẢO</span>
      </div>

      <div className="wearo-ai-card-body">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="wearo-ai-field-label">01 · Ảnh của bạn</span>
            <label className="wearo-ai-upload-label mt-2 flex min-h-[260px] cursor-pointer items-center justify-center border border-[rgba(84,114,140,.18)] bg-[rgba(242,206,174,.10)] p-4 text-center">
              {personPreview ? (
                <img src={personPreview} alt="Ảnh người dùng đã tải lên" className="max-h-[330px] w-full object-contain" />
              ) : (
                <span className="text-sm leading-6 text-silver">
                  <strong className="block text-[#54728C]">Chọn ảnh toàn thân</strong>
                  JPG, PNG hoặc WEBP · tối đa 6MB<br />
                  Ánh sáng tốt · nền gọn · chỉ một người
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Chọn ảnh toàn thân để thử đồ bằng AI"
                aria-describedby="wearo-tryon-photo-guidance"
                className="sr-only"
                onChange={(event) => handlePersonImage(event.target.files?.[0])}
              />
            </label>
            {personPreview ? <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <label className="cursor-pointer font-semibold text-[#54728C] underline underline-offset-4">Thay ảnh<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { handlePersonImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
              <button type="button" className="font-semibold text-[#54728C] underline underline-offset-4" onClick={() => { setPersonImage(""); setPersonPreview(""); setResultImage(""); setStatus("idle"); setError(""); }}>Xóa ảnh</button>
            </div> : null}
            <p id="wearo-tryon-photo-guidance" className="mt-2 text-xs leading-5 text-silver">Ảnh của bạn được gửi tới nhà cung cấp AI để xử lý. Chỉ dùng ảnh bạn có quyền sử dụng; tránh ảnh riêng tư hoặc thông tin nhạy cảm. Hãy chọn ảnh đủ sáng, thấy rõ toàn thân và chỉ có một người.</p>
          </div>

          <div>
            <label htmlFor="wearo-tryon-product" className="wearo-ai-field-label">02 · Chọn sản phẩm</label>
            <select
              id="wearo-tryon-product"
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setResultImage("");
                setStatus("idle");
                setError("");
              }}
              className="mt-2 w-full border border-[rgba(84,114,140,.18)] bg-background px-3 py-3 text-sm"
              disabled={!products.length || status === "uploading" || status === "processing"}
            >
              {!products.length ? <option value="">Chưa có sản phẩm khả dụng</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.category}
                </option>
              ))}
            </select>

            {(() => {
              const selectedProduct = products.find((product) => product.id === productId);
              if (!selectedProduct) return (
                <div className="mt-3 border border-dashed border-[rgba(84,114,140,.24)] p-4 text-sm text-silver">
                  Chọn một sản phẩm để xem ảnh trước khi thử đồ.
                </div>
              );
              return (
                <article className="mt-3 grid grid-cols-[104px_minmax(0,1fr)] gap-3 border border-[rgba(84,114,140,.16)] bg-[rgba(242,206,174,.10)] p-3 sm:grid-cols-[124px_minmax(0,1fr)]">
                  <div className="flex min-h-[124px] items-center justify-center bg-white">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      loading="lazy"
                      className="h-full max-h-[160px] w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 self-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#54728C]">Ảnh sản phẩm</p>
                    <h3 className="mt-1 text-sm font-semibold leading-5 text-[#171717]">{selectedProduct.name}</h3>
                    <p className="mt-1 text-xs text-silver">{selectedProduct.category}</p>
                    {selectedProduct.price > 0 ? <p className="mt-2 text-sm font-semibold text-[#54728C]">{selectedProduct.price.toLocaleString("vi-VN")} ₫</p> : null}
                    <p className="mt-2 text-[11px] leading-4 text-silver">Ảnh tham khảo trước khi tạo kết quả AI.</p>
                  </div>
                </article>
              );
            })()}

            <div className="mt-5">
              <label htmlFor="wearo-tryon-note" className="wearo-ai-field-label">Ghi chú thêm <small>· không bắt buộc</small></label>
              <textarea
                id="wearo-tryon-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={400}
                className="wearo-ai-textarea mt-2"
                placeholder="Ví dụ: giữ nguyên nền ảnh, phối tự nhiên, form hơi rộng…"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="wearo-ai-helper">
                {status === "processing" ? "Ảnh đã được gửi — AI đang tạo kết quả. Giữ trang này mở để xem tiến trình." : "Ảnh rõ, đủ sáng và chỉ có một người thường giúp kết quả tốt hơn."}
              </p>
              <button
                type="button"
                className="wearo-ai-generate"
                onClick={handleTryOn}
                disabled={status === "uploading" || (status === "processing" && isPolling) || !products.length}
              >
                {status === "uploading" ? "Đang gửi ảnh…" : status === "processing" ? (isPolling ? "Đang kiểm tra…" : "Kiểm tra lại kết quả") : "Thử đồ bằng AI"}
              </button>
            </div>

            {error ? (
              <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-7 border-t border-[rgba(84,114,140,.14)] pt-6">
          <span className="wearo-ai-field-label">03 · Kết quả thử đồ</span>
          <div aria-live="polite" className="mt-2 min-h-[300px] border border-[rgba(84,114,140,.18)] bg-[rgba(242,206,174,.08)] p-4">
            {resultImage ? (
              <img src={resultImage} alt="Kết quả thử đồ ảo WEARO" className="mx-auto max-h-[620px] w-full object-contain" />
            ) : (
              <div className="flex min-h-[270px] items-center justify-center text-center text-sm leading-6 text-silver">
                {status === "uploading" || status === "processing" ? (
                  <AiLoader label={status === "uploading" ? "Đang gửi ảnh đến AI…" : "AI đang tạo ảnh thử đồ…"} />
                ) : status === "failed" ? "Chưa tạo được kết quả. Kiểm tra ảnh và thử lại." : "Chọn sản phẩm, tải ảnh phù hợp rồi bấm “Thử đồ bằng AI”."}
              </div>
            )}
          </div>
          {resultImage ? <div className="mt-3 flex flex-wrap gap-3"><button type="button" className="wearo-ai-text-action" onClick={handleTryOn} disabled={status === "uploading" || status === "processing"}>Thử lại</button><button type="button" className="wearo-ai-text-action" onClick={() => { setResultImage(""); setStatus("idle"); }}>Đổi sản phẩm</button><button type="button" className="wearo-ai-text-action" onClick={() => { const link = document.createElement("a"); link.href = resultImage; link.download = "wearo-virtual-try-on.png"; link.click(); }}>Lưu ảnh</button></div> : null}
        </div>
      </div>
    </section>
  );
}

function AiPage() {
  const search = Route.useSearch();
  const [consented, setConsented] = useState(false);
  const [consentReady, setConsentReady] = useState(false);
  const [style, setStyle] = useState("Casual");
  const [occasion, setOccasion] = useState("Đi chơi");
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<AiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [recommendations, setRecommendations] = useState<StylistRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");
  const [mode, setMode] = useState<"concept" | "tryon">(search.mode ?? (search.product ? "tryon" : "concept"));

  useEffect(() => {
    setConsented(window.localStorage.getItem(CONSENT_KEY) === "accepted");
    setConsentReady(true);
  }, []);

  useEffect(() => {
    if (!consented) return;
    let active = true;
    setProductsLoading(true);
    setProductsError("");
    listAiProducts()
      .then((items) => {
        if (active) setProducts(items.filter(Boolean) as AiProduct[]);
      })
      .catch(() => {
        if (active) setProductsError("Chưa thể tải danh sách sản phẩm cho AI Try-On.");
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [consented]);

  function acceptConsent() {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setConsented(true);
  }

  function reviewConsent() {
    window.localStorage.removeItem(CONSENT_KEY);
    setConsented(false);
    setConsentReady(true);
  }

  async function handleGenerate() {
    const accessToken = getCustomerAccessToken();
    const userBrief = brief.trim() || "Hãy đề xuất một outfit phù hợp với phong cách và dịp đã chọn.";
    setIsLoading(true);
    setError("");
    setResult("");
    setRecommendations([]);
    setRecommendationsError("");

    try {
      const response = await generateWearoAiReply({
        data: {
          ...(accessToken ? { accessToken } : {}),
          messages: [
            {
              role: "user",
              content: [
                `Phong cách: ${style}`,
                `Dịp: ${occasion}`,
                search.product ? `Sản phẩm tham chiếu: ${search.product}` : "",
                `Yêu cầu: ${userBrief}`,
                "Hãy trả lời như WEARO AI Stylist: ngắn gọn, cụ thể, có cấu trúc outfit và lý do phối.",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        },
      });
      setResult(response.text);

      setRecommendationsLoading(true);
      try {
        const recommendationResponse = await getStylistRecommendations({
          data: {
            occasion,
            mood: userBrief,
            preferences: {
              style_tags: [style],
            },
            limit: 4,
          },
        });
        setRecommendations(recommendationResponse.recommendations);
      } catch {
        setRecommendationsError("Concept đã tạo, nhưng chưa thể tải sản phẩm phù hợp lúc này.");
      } finally {
        setRecommendationsLoading(false);
      }
    } catch {
      setError("Chưa thể kết nối WEARO AI lúc này. Hãy thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="wearo-ai-phase2 min-h-screen bg-background text-foreground">
      <SiteNav />
      {!consentReady ? (
        <main className="wearo-ai-page"><div className="wearo-ai-consent-shell"><div className="ai-consent-panel" aria-hidden="true" /></div></main>
      ) : !consented ? (
        <AiConsent onAccept={acceptConsent} />
      ) : (
        <main className="wearo-ai-page">
          <div className="wearo-ai-shell">
            <header>
              <div className="mb-2 flex flex-wrap items-center gap-3">
              <p className="wearo-ai-kicker">WEARO / AI STUDIO</p>
              <span className="inline-flex items-center border border-[#D8B56D] bg-[#FFF4D8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6D4C12]" aria-label="Bản thử nghiệm">BETA</span>
            </div>
              <h1 className="wearo-ai-title wearo-ai-display">
                <img
                  src="/brand/wearo-logo-header.svg"
                  alt="WEARO"
                  className="inline-block h-[0.82em] w-auto max-w-[4.5em] align-middle object-contain"
                />{" "}
                <span className="wearo-ai-title-accent">AI Studio</span>
              </h1>
              <p className="wearo-ai-lede">Bạn đã có món đồ muốn thử, hay cần gợi ý mặc gì? Chọn một cách bắt đầu — bạn có thể đổi chế độ bất cứ lúc nào.</p>
              <button type="button" onClick={reviewConsent} className="mt-3 inline-flex min-h-10 items-center border border-[rgba(84,114,140,.38)] px-3 py-2 text-xs font-semibold text-[#54728C] transition hover:bg-[rgba(242,206,174,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C] focus-visible:ring-offset-2">
                Quản lý chấp thuận & thông tin dữ liệu
              </button>
            </header>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Giới thiệu tính năng AI Studio">
              <figure className="min-w-0 overflow-hidden border border-[rgba(84,114,140,.18)] bg-white">
                <img
                  src="/images/banners/wearo-ai-virtual-try-on-banner.webp"
                  alt="WEARO AI Virtual Try-On — trải nghiệm thử trang phục bằng AI"
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/7] w-full object-cover object-center"
                />
              </figure>
              <figure className="min-w-0 overflow-hidden border border-[rgba(84,114,140,.18)] bg-white">
                <img
                  src="/images/banners/wearo-ai-stylist-banner.webp"
                  alt="WEARO AI Stylist — khám phá ý tưởng phối đồ theo phong cách riêng"
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/7] w-full object-cover object-center"
                />
              </figure>
            </div>

            <div className="wearo-ai-start-choices" role="group" aria-label="Chọn cách bắt đầu">
              <button type="button" aria-pressed={mode === "tryon"} data-active={mode === "tryon"} onClick={() => setMode("tryon")}><span aria-hidden="true">01</span><strong>Thử một sản phẩm</strong><small>Chọn ảnh toàn thân và món đồ bạn muốn xem thử bằng AI.</small></button>
              <button type="button" aria-pressed={mode === "concept"} data-active={mode === "concept"} onClick={() => setMode("concept")}><span aria-hidden="true">02</span><strong>Tìm ý tưởng outfit</strong><small>Chọn phong cách và dịp sử dụng để nhận gợi ý từ AI Stylist.</small></button>
            </div>

            {mode === "concept" ? <>
            <div className="wearo-ai-grid">
              <section className="wearo-ai-card">
                <div className="wearo-ai-card-header">
                  <span className="wearo-ai-card-title">01 · Chọn phong cách</span>
                  <span className="wearo-ai-kicker">BƯỚC 1</span>
                </div>

                <div className="wearo-ai-card-body">
                  <div>
                    <span className="wearo-ai-field-label">01 · Phong cách <small>· chọn một</small></span>
                    <div className="wearo-ai-chip-group">
                      {STYLES.map((item) => (
                        <button key={item} type="button" aria-pressed={style === item} className="wearo-ai-chip" data-active={style === item} onClick={() => setStyle(item)}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="wearo-ai-field-label">02 · Dịp sử dụng <small>· chọn một</small></span>
                    <div className="wearo-ai-chip-group">
                      {OCCASIONS.map((item) => (
                        <button key={item} type="button" aria-pressed={occasion === item} className="wearo-ai-chip" data-active={occasion === item} onClick={() => setOccasion(item)}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {search.product ? (
                    <div className="mt-6 border border-[rgba(84,114,140,.16)] bg-[rgba(242,206,174,.18)] p-3">
                      <span className="wearo-ai-field-label">Sản phẩm tham chiếu</span>
                      <p className="text-xs text-[#171717]">{search.product}</p>
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <label htmlFor="wearo-ai-brief" className="wearo-ai-field-label">Mô tả outfit <small>· không bắt buộc</small></label>
                    <textarea id="wearo-ai-brief" value={brief} onChange={(event) => setBrief(event.target.value)} className="wearo-ai-textarea" placeholder="Ví dụ: áo form rộng, màu navy, quần ống suông và sneaker trắng…" />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="wearo-ai-helper">1. Chọn phong cách và dịp · 2. Thêm mô tả nếu muốn · 3. Tạo concept để xem gợi ý.</p>
                    <button type="button" className="wearo-ai-generate" onClick={handleGenerate} disabled={isLoading}>
                      {isLoading ? "Đang tạo…" : "Tạo concept"}
                    </button>
                  </div>
                </div>
              </section>

              <aside className="wearo-ai-card wearo-ai-result">
                <div className="wearo-ai-card-header">
                  <span className="wearo-ai-card-title">02 · Kết quả concept</span>
                  <span className="wearo-ai-kicker">BƯỚC 2</span>
                </div>

                <div className="wearo-ai-card-body">
                  {error ? (
                    <div className="wearo-ai-result-empty">
                      <div><div className="wearo-ai-result-mark">!</div><h3>Không thể tạo concept</h3><p>{error}</p></div>
                    </div>
                  ) : result ? (
                    <div className="min-h-[330px] border border-[rgba(84,114,140,.18)] bg-[rgba(242,206,174,.12)] p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-[#171717]">{result}</p>
                    </div>
                  ) : (
                    <div className="wearo-ai-result-empty">
                      <div>
                        {isLoading ? <AiLoader label="WEARO AI Stylist đang tạo outfit…" /> : <div className="wearo-ai-result-mark">✦</div>}
                        <h3>{isLoading ? "Đang tạo outfit…" : "Sẵn sàng tạo concept"}</h3>
                        <p>{isLoading ? "WEARO AI Stylist đang xây dựng gợi ý dựa trên lựa chọn của bạn." : "Chọn một phong cách và một dịp, thêm mô tả nếu muốn, rồi bấm “Tạo concept”."}</p>
                      </div>
                    </div>
                  )}

                  <div className="wearo-ai-tools">
                    <Link to="/shop" className="wearo-ai-tool" aria-label="Mở cửa hàng WEARO" title="Mở cửa hàng WEARO">
                      <img src="/brand/wearo-shop-icon.svg" alt="" aria-hidden="true" className="h-6 w-6" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>

            {result ? <section className="wearo-ai-card mt-6" aria-labelledby="wearo-ai-recommendations-title">
              <div className="wearo-ai-card-header">
                <span id="wearo-ai-recommendations-title" className="wearo-ai-card-title">03 · Sản phẩm AI đề xuất</span>
                <span className="wearo-ai-kicker">CATALOG / REAL DATA</span>
              </div>
              <div className="wearo-ai-card-body">
                {recommendationsLoading ? (
                  <AiLoader label="Đang đối chiếu concept với sản phẩm WEARO đã xuất bản…" />
                ) : recommendationsError ? (
                  <div className="border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{recommendationsError}</div>
                ) : recommendations.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {recommendations.map((item) => {
                      const product = item.product as Record<string, unknown>;
                      const productId = String(product.id ?? "");
                      const productName = String(product.name ?? "Sản phẩm WEARO");
                      const category = String(product.category ?? "");
                      const price = Number(product.price ?? 0);
                      return (
                        <article key={productId} className="border border-[rgba(84,114,140,.16)] bg-[rgba(242,206,174,.08)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#171717]">{productName}</p>
                              {category ? <p className="mt-1 text-xs text-silver">{category}</p> : null}
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-[#54728C]">{item.score}/100</span>
                          </div>
                          {price > 0 ? <p className="mt-4 text-sm font-semibold text-[#171717]">{price.toLocaleString("vi-VN")} ₫</p> : null}
                          <p className="mt-3 min-h-[60px] text-xs leading-5 text-silver">{item.reason}</p>
                          <div className="mt-4 grid gap-2">
                            <Link to="/ai" search={{ product: productId }} className="inline-flex w-full items-center justify-center bg-[#54728C] px-3 py-2.5 text-xs font-semibold uppercase tracking-[.12em] text-white transition hover:bg-[#45647A]">Thử sản phẩm bằng AI →</Link>
                            <Link
                              to="/product/$id"
                              params={{ id: productId }}
                              className="inline-flex w-full items-center justify-center border border-[#54728C] px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] text-[#54728C] transition hover:bg-[#54728C] hover:text-white"
                            >Xem chi tiết sản phẩm</Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-[rgba(84,114,140,.14)] bg-[rgba(242,206,174,.08)] p-5 text-sm leading-6 text-silver">
                    Hãy bấm “Tạo concept” để WEARO AI đối chiếu nhu cầu với catalog thật và trả về sản phẩm phù hợp.
                  </div>
                )}
              </div>
            </section> : null}
            </> : (
            <div className="mt-6">
              {productsLoading ? (
                <section className="wearo-ai-card">
                  <div className="wearo-ai-card-body"><AiLoader label="Đang tải sản phẩm đã xuất bản cho AI Try-On…" /></div>
                </section>
              ) : productsError ? (
                <section className="wearo-ai-card">
                  <div className="wearo-ai-card-body text-sm text-red-700">{productsError}</div>
                </section>
              ) : (
                <TryOnStudio products={products} initialProductId={search.product} />
              )}
            </div>
            )}
          </div>
        </main>
      )}
      <SiteFooter />
    </div>
  );
}
