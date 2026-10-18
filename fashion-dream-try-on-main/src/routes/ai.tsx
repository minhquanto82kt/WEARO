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
  validateSearch: (search: Record<string, unknown>): { product?: string } =>
    typeof search["product"] === "string" ? { product: search["product"] } : {},
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

  return (
    <main className="wearo-ai-page">
      <div className="wearo-ai-consent-shell">
        <section className="ai-consent-panel" aria-labelledby="ai-consent-title">
          <div className="border-b border-[rgba(84,114,140,.16)] pb-5">
            <p className="eyebrow">WEARO / AI STUDIO · NOTICE</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54728C]">01 · Before you begin</p>
          </div>

          <h1 id="ai-consent-title" className="wearo-ai-display mt-6">
            Trước khi sử dụng AI Studio
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-silver">
            WEARO AI hỗ trợ tư vấn phong cách, tạo concept và thử đồ ảo. Vui lòng đọc nhanh các nguyên tắc dưới đây trước khi tiếp tục; kết quả AI chỉ mang tính tham khảo.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              ["01", "Ảnh & quyền sử dụng", "Chỉ tải lên hình ảnh bạn có quyền sử dụng. Không sử dụng hình ảnh của người khác khi chưa được cho phép."],
              ["02", "Nội dung & quyền riêng tư", "Ảnh tải lên sẽ được gửi đến nhà cung cấp AI bên thứ ba đang được cấu hình để xử lý. Không tải lên ảnh riêng tư hoặc thông tin nhạy cảm; không dùng AI để xâm phạm quyền riêng tư, danh dự hoặc sở hữu trí tuệ."],
              ["03", "Kết quả AI", "Màu sắc, kích thước, form và hình ảnh tạo bởi AI có thể khác sản phẩm thực tế và không phải cam kết về sản phẩm."],
              ["04", "Thông tin cung cấp", "Không nhập thông tin nhạy cảm. Chỉ cung cấp thông tin cần thiết để WEARO hỗ trợ bạn."],
              ["05", "Trách nhiệm sử dụng", "Bạn chịu trách nhiệm về nội dung mình cung cấp và xác nhận đã đọc, hiểu các quy định khi tiếp tục."],
            ].map(([number, title, description]) => (
              <div key={number} className="group grid grid-cols-[42px_1fr] gap-4 border border-[rgba(84,114,140,.14)] bg-[rgba(242,206,174,.07)] p-4 transition-colors hover:bg-[rgba(242,206,174,.14)] sm:grid-cols-[48px_1fr] sm:gap-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(84,114,140,.28)] text-[10px] font-semibold tracking-[.08em] text-[#54728C] sm:h-10 sm:w-10">
                  {number}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-1.5 text-xs leading-6 text-silver sm:text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <label className="ai-consent-check mt-7 flex cursor-pointer items-start gap-3 rounded-sm border border-[rgba(84,114,140,.16)] p-4 transition-colors hover:bg-[rgba(242,206,174,.10)]">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#54728C]"
            />
            <span className="text-sm leading-6 text-foreground">
              Tôi đã đọc, hiểu và chấp nhận các quy định sử dụng WEARO AI Studio.
            </span>
          </label>

          <button
            type="button"
            className="mt-4 w-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54728C] focus-visible:ring-offset-2"
            disabled={!checked}
            onClick={onAccept}
          >
            Tiếp tục vào AI Studio <span aria-hidden="true">→</span>
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-silver">Bạn có thể rời trang bất cứ lúc nào.</p>
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
        <span className="wearo-ai-card-title">01–04 · Quy trình thử đồ</span>
        <span className="wearo-ai-kicker">AI / IMAGE</span>
      </div>

      <div className="wearo-ai-card-body">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="wearo-ai-field-label">03 · Tải ảnh của bạn</span>
            <label className="mt-2 flex min-h-[260px] cursor-pointer items-center justify-center border border-[rgba(84,114,140,.18)] bg-[rgba(242,206,174,.10)] p-4 text-center">
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
                className="sr-only"
                onChange={(event) => handlePersonImage(event.target.files?.[0])}
              />
            </label>
            {personPreview ? <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <label className="cursor-pointer font-semibold text-[#54728C] underline underline-offset-4">Thay ảnh<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { handlePersonImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
              <button type="button" className="font-semibold text-[#54728C] underline underline-offset-4" onClick={() => { setPersonImage(""); setPersonPreview(""); setResultImage(""); setStatus("idle"); setError(""); }}>Xóa ảnh</button>
            </div> : null}
            <p className="mt-2 text-xs leading-5 text-silver">Ảnh được gửi tới pipeline AI để tạo ảnh thử đồ. Tránh tải ảnh nhạy cảm; cách lưu và thời gian lưu phụ thuộc dịch vụ xử lý đang dùng.</p>
          </div>

          <div>
            <label htmlFor="wearo-tryon-product" className="wearo-ai-field-label">02 · Chọn sản phẩm WEARO</label>
            <select
              id="wearo-tryon-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
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

            {productId ? (
              <div className="mt-4 border border-[rgba(84,114,140,.16)] bg-[rgba(242,206,174,.12)] p-3">
                <p className="text-xs font-semibold text-[#54728C]">SẢN PHẨM ĐƯỢC CHỌN</p>
                <p className="mt-1 text-sm text-[#171717]">
                  {products.find((product) => product.id === productId)?.name ?? "Sản phẩm"}
                </p>
              </div>
            ) : null}

            <div className="mt-5">
              <label htmlFor="wearo-tryon-note" className="wearo-ai-field-label">Ghi chú phối đồ · không bắt buộc</label>
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
                {status === "processing" ? "WEARO đang xử lý ảnh…" : "Kết quả được tạo từ pipeline AI Try-On hiện có."}
              </p>
              <button
                type="button"
                className="wearo-ai-generate"
                onClick={handleTryOn}
                disabled={status === "uploading" || (status === "processing" && isPolling) || !products.length}
              >
                {status === "uploading" ? "Đang gửi…" : status === "processing" ? (isPolling ? "Đang xử lý…" : "Kiểm tra kết quả") : "Thử đồ bằng AI"}
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
          <span className="wearo-ai-field-label">04 · Kết quả thử đồ</span>
          <div className="mt-2 min-h-[300px] border border-[rgba(84,114,140,.18)] bg-[rgba(242,206,174,.08)] p-4">
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
  const [mode, setMode] = useState<"concept" | "tryon">(search.product ? "tryon" : "concept");

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
              <p className="wearo-ai-kicker">WEARO / AI STUDIO · BETA</p>
              <h1 className="wearo-ai-title wearo-ai-display">
                <img
                  src="/brand/wearo-logo-header.svg"
                  alt="WEARO"
                  className="inline-block h-[0.82em] w-auto max-w-[4.5em] align-middle object-contain"
                />{" "}
                <span className="wearo-ai-title-accent">AI Studio</span>
              </h1>
              <p className="wearo-ai-lede">Bắt đầu bằng cách tạo outfit theo phong cách của bạn hoặc chọn một sản phẩm để thử trực tiếp.</p>
            </header>

            <div className="wearo-ai-start-choices" role="group" aria-label="Chọn cách bắt đầu">
              <button type="button" data-active={mode === "tryon"} onClick={() => setMode("tryon")}><span>01</span><strong>AI Virtual Try-on</strong><small>Tải ảnh của bạn và thử sản phẩm trực tiếp</small></button>
              <button type="button" data-active={mode === "concept"} onClick={() => setMode("concept")}><span>02</span><strong>AI Stylist</strong><small>Tạo outfit theo phong cách và dịp sử dụng</small></button>
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
                        <button key={item} type="button" className="wearo-ai-chip" data-active={style === item} onClick={() => setStyle(item)}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="wearo-ai-field-label">02 · Dịp sử dụng <small>· chọn một</small></span>
                    <div className="wearo-ai-chip-group">
                      {OCCASIONS.map((item) => (
                        <button key={item} type="button" className="wearo-ai-chip" data-active={occasion === item} onClick={() => setOccasion(item)}>
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
                    <p className="wearo-ai-helper">AI dùng các lựa chọn trên làm context cho Stylist.</p>
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
