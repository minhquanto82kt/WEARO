import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { ArrowUp, Check, ExternalLink, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/i18n";
import { submitStylistFeedback, trackStylistEvent } from "@/lib/stylist-feedback.functions";
import { useEffect, useState } from "react";
import { generateWearoAiReply } from "@/lib/wearo-ai-chat.functions";
import { getCustomerAccessToken } from "@/lib/auth";

type StylistPreferences = { occasion: string; style: string; color: string; budget: string };
type StylistRecommendation = { id: string; name: string; category?: string; price?: number; image?: string; score: number; reason: string };
let activeStylistSessionId = "";
let selectedPreferences: StylistPreferences = { occasion: "", style: "", color: "", budget: "" };

const modelAdapter: ChatModelAdapter = {
  async run({ messages }) {
    const accessToken = getCustomerAccessToken();
    if (!accessToken) throw new Error("MEMBER_REQUIRED");
    const preferences = selectedPreferences;
    const preferenceText = [
      preferences.occasion && `Dịp sử dụng: ${preferences.occasion}`,
      preferences.style && `Phong cách: ${preferences.style}`,
      preferences.color && `Màu sắc ưu tiên: ${preferences.color}`,
      preferences.budget && `Ngân sách tối đa: ${preferences.budget} VND`,
    ].filter(Boolean).join("; ");
    const normalized = messages
      .map((message) => ({
        role: message.role === "user" ? "user" as const : "assistant" as const,
        content: message.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n"),
      }))
      .filter((message) => message.content.trim().length > 0)
      .map((message, index, all) => index === all.length - 1 && message.role === "user" && preferenceText
        ? { ...message, content: `${message.content}\n\nTiêu chí Stylist đã chọn: ${preferenceText}. Hãy ưu tiên các tiêu chí này khi tìm sản phẩm trong danh mục thật; không tự bịa sản phẩm hoặc giá.` }
        : message);

    const result = await generateWearoAiReply({ data: { accessToken, messages: normalized } });
    if (typeof window !== "undefined" && result.recommendations.length) {
      window.dispatchEvent(new CustomEvent("wearo:stylist-recommendations", { detail: result.recommendations }));
      void trackStylistEvent({ data: { accessToken, sessionId: activeStylistSessionId, eventType: "recommendation_view", recommendationIds: result.recommendations.map((item) => item.id) } }).catch(() => undefined);
    }
    return { content: [{ type: "text", text: result.text }] };
  },
};

function StylistPreferencePanel() {
  const [preferences, setPreferences] = useState<StylistPreferences>(selectedPreferences);
  const update = (key: keyof StylistPreferences, value: string) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    selectedPreferences = next;
  };
  const fieldClass = "min-w-0 rounded-lg border border-[rgba(84,114,140,.22)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--wearo-blue,#54728C)]";
  return (
    <section className="border-b border-[rgba(84,114,140,.16)] px-4 py-4 sm:px-6" aria-label="Tiêu chí phối đồ">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tùy chỉnh gợi ý</h2>
          <p className="text-xs text-silver">Chọn tiêu chí để Stylist ưu tiên khi tìm sản phẩm.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-xs text-silver">Dịp sử dụng
          <select className={fieldClass} value={preferences.occasion} onChange={(event) => update("occasion", event.target.value)}>
            <option value="">Chọn dịp</option><option>Đi học</option><option>Đi làm</option><option>Hẹn hò</option><option>Đi chơi</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-silver">Phong cách
          <select className={fieldClass} value={preferences.style} onChange={(event) => update("style", event.target.value)}>
            <option value="">Mọi phong cách</option><option>Minimal</option><option>Smart casual</option><option>Streetwear</option><option>Y2K</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-silver">Màu sắc
          <select className={fieldClass} value={preferences.color} onChange={(event) => update("color", event.target.value)}>
            <option value="">Không ưu tiên</option><option>Đen</option><option>Trắng</option><option>Beige</option><option>Xanh navy</option><option>Xanh dương</option><option>Xám</option><option>Nâu</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-silver">Ngân sách tối đa (VNĐ)
          <input className={fieldClass} type="number" min="0" step="50000" inputMode="numeric" placeholder="Ví dụ: 800000" value={preferences.budget} onChange={(event) => update("budget", event.target.value)} />
        </label>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-silver">Tiêu chí được gửi kèm tin nhắn tiếp theo. Bộ lọc ngân sách chỉ có hiệu lực khi dịch vụ danh mục hỗ trợ lọc theo giá.</p>
    </section>
  );
}

function StylistRecommendationPanel() {
  const [items, setItems] = useState<StylistRecommendation[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [sessionId] = useState(() => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `stylist-${Date.now()}`);
  useEffect(() => { activeStylistSessionId = sessionId; }, [sessionId]);
  useEffect(() => {
    const onRecommendations = (event: Event) => { const detail = (event as CustomEvent<StylistRecommendation[]>).detail; setItems(Array.isArray(detail) ? detail : []); setFeedback(null); setFeedbackError(""); };
    window.addEventListener("wearo:stylist-recommendations", onRecommendations);
    return () => window.removeEventListener("wearo:stylist-recommendations", onRecommendations);
  }, []);
  if (!items.length) return null;
  const ids = items.map((item) => item.id);
  const sendFeedback = async (helpful: boolean) => {
    setSavingFeedback(true); setFeedbackError("");
    try { const accessToken = getCustomerAccessToken(); await submitStylistFeedback({ data: { accessToken: accessToken || undefined, sessionId, recommendationIds: ids, helpful } }); setFeedback(helpful); }
    catch { setFeedbackError("Chưa lưu được đánh giá. Vui lòng thử lại."); }
    finally { setSavingFeedback(false); }
  };
  return <section className="border-t border-[rgba(84,114,140,.16)] px-4 py-4 sm:px-6" aria-label="Sản phẩm Stylist gợi ý">
    <div className="mb-3"><h2 className="text-sm font-semibold text-foreground">Sản phẩm phù hợp với bạn</h2><p className="text-xs text-silver">Lấy từ danh mục WEARO đang được xuất bản.</p></div>
    {items.length > 1 && <div className="mb-3 rounded-xl border border-[rgba(84,114,140,.2)] bg-[rgba(242,206,174,.18)] p-3"><p className="mb-2 text-xs font-semibold">Gợi ý phối cùng</p><div className="flex flex-wrap gap-2">{items.slice(0, 2).map((item) => <span key={item.id} className="rounded-full bg-background px-2.5 py-1 text-xs">{item.name}</span>)}</div><p className="mt-2 text-xs text-silver">Mở từng sản phẩm để kiểm tra màu, size và khả năng phối thực tế.</p></div>}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="flex min-w-0 gap-3 rounded-xl border border-[rgba(84,114,140,.18)] p-3">
      {item.image ? <img src={item.image} alt={item.name} loading="lazy" className="h-24 w-20 shrink-0 rounded-lg bg-muted object-cover" /> : <div className="h-24 w-20 shrink-0 rounded-lg bg-muted" />}
      <div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{item.name}</h3>{typeof item.price === "number" && <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(item.price, "vi")}</p>}<p className="mt-1 line-clamp-2 text-xs leading-5 text-silver">{item.reason}</p>
      <Link to="/product/$id" params={{ id: item.id }} onClick={() => { const accessToken = getCustomerAccessToken(); void trackStylistEvent({ data: { accessToken: accessToken || undefined, sessionId, eventType: "product_click", productId: item.id, recommendationIds: ids } }).catch(() => undefined); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-4">Xem sản phẩm <ExternalLink className="size-3" /></Link></div>
    </article>)}</div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3"><span className="text-xs text-silver">Gợi ý này có hữu ích không?</span>
      <button type="button" disabled={savingFeedback || feedback !== null} onClick={() => void sendFeedback(true)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs disabled:opacity-50"><ThumbsUp className="size-3.5" /> Hữu ích</button>
      <button type="button" disabled={savingFeedback || feedback !== null} onClick={() => void sendFeedback(false)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs disabled:opacity-50"><ThumbsDown className="size-3.5" /> Chưa phù hợp</button>
      {feedback !== null && <span className="inline-flex items-center gap-1 text-xs text-primary"><Check className="size-3.5" /> Đã lưu</span>}{feedbackError && <span role="alert" className="text-xs text-destructive">{feedbackError}</span>}
    </div>
  </section>;
}

function WearoMessage() {
  return (
    <MessagePrimitive.Root className="wearo-ai-message wearo-ai-message-assistant">
      <div className="wearo-ai-message-icon" aria-hidden="true"><Sparkles className="size-3.5" /></div>
      <div className="wearo-ai-message-copy"><MessagePrimitive.Parts>{({ part }) => (part.type === "text" ? <MessagePartPrimitive.Text /> : null)}</MessagePrimitive.Parts></div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="wearo-ai-message wearo-ai-message-user">
      <div className="wearo-ai-user-bubble"><MessagePrimitive.Parts>{({ part }) => (part.type === "text" ? <MessagePartPrimitive.Text /> : null)}</MessagePrimitive.Parts></div>
    </MessagePrimitive.Root>
  );
}

function WearoThread() {
  return (
    <ThreadPrimitive.Root className="wearo-ai-thread">
      <StylistPreferencePanel />
      <ThreadPrimitive.Viewport className="wearo-ai-thread-viewport"><ThreadPrimitive.Messages>{({ message }) => (message.role === "user" ? <UserMessage /> : <WearoMessage />)}</ThreadPrimitive.Messages></ThreadPrimitive.Viewport>
      <StylistRecommendationPanel />
      <div className="wearo-ai-composer-wrap">
        <ComposerPrimitive.Root className="wearo-ai-composer">
          <ComposerPrimitive.Input placeholder="Ví dụ: Phối gì với hoodie beige để đi học?" rows={2} className="wearo-ai-composer-input" />
          <ComposerPrimitive.Send className="wearo-ai-composer-send" aria-label="Gửi tin nhắn"><ArrowUp className="size-4" /></ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
        <p className="wearo-ai-composer-note">Không chia sẻ thông tin nhạy cảm. AI có thể đưa ra gợi ý chưa hoàn toàn chính xác.</p>
      </div>
    </ThreadPrimitive.Root>
  );
}

export function WearoAiAssistant() {
  const runtime = useLocalRuntime(modelAdapter, { maxSteps: 1 });
  return <AssistantRuntimeProvider runtime={runtime}><WearoThread /></AssistantRuntimeProvider>;
}
