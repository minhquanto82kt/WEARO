import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PRODUCTS, formatVnd, getProduct } from "@/data/products";
import { generateConcept, generateTryOn } from "@/lib/ai.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/ai")({
  validateSearch: (search: Record<string, unknown>): { product?: string } =>
    typeof search["product"] === "string" ? { product: search["product"] } : {},
  head: () => ({
    meta: [
      { title: "AI Lab — Concept & Virtual Try-On | UpThink" },
      {
        name: "description",
        content:
          "Tạo concept outfit bằng AI và thử đồ ảo trên ảnh của chính bạn trước khi mua tại UpThink.",
      },
      { property: "og:title", content: "UpThink AI Lab" },
      {
        property: "og:description",
        content: "Concept AI và Virtual Try-On cho thời trang cá nhân hóa.",
      },
    ],
  }),
  component: AiPage,
});

const STYLES = ["Street", "Minimal", "Smart casual", "Y2K"];
const OCCASIONS = ["Đi học", "Đi làm", "Hẹn hò", "Đi chơi"];

function AiPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"concept" | "tryon">(search.product ? "tryon" : "concept");

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-28 sm:px-12">
        <p className="eyebrow">AI Experience · Beta</p>
        <h1 className="mt-3 text-4xl leading-none sm:text-5xl">
          Concept + <span className="text-primary">Virtual Try-On</span>
        </h1>
        <h3 className="mt-5 text-xl font-medium uppercase tracking-[0.08em] text-foreground">
          AI workspace
        </h3>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-beige">
          Hai luồng trong một workspace: tạo concept outfit theo mood, hoặc thử sản phẩm UpThink
          ngay trên ảnh của bạn.
        </p>

        <div className="mt-8 flex gap-2">
          {(["concept", "tryon"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`border px-5 py-2 text-xs uppercase tracking-[0.15em] ${
                mode === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-beige hover:border-primary"
              }`}
            >
              {m === "concept" ? "Concept AI" : "Virtual Try-On"}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {mode === "concept" ? <ConceptPanel /> : <TryOnPanel initialProduct={search.product} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ResultPanel({
  image,
  pending,
  emptyLabel,
}: {
  image?: string | undefined;
  pending: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="flex aspect-[3/4] items-center justify-center border border-border bg-card">
      {pending ? (
        <div className="flex flex-col items-center gap-3 text-silver">
          <span className="wearo-ai-loader" aria-hidden="true"><span /><span /><span /></span>
          <span className="text-xs uppercase tracking-[0.2em]">AI đang dựng ảnh…</span>
        </div>
      ) : image ? (
        <img src={image} alt="Kết quả AI" className="size-full object-cover" />
      ) : (
        <p className="max-w-xs px-6 text-center text-sm text-silver">{emptyLabel}</p>
      )}
    </div>
  );
}

function ConceptPanel() {
  const run = useServerFn(generateConcept);
  const { items } = useCart();
  const [style, setStyle] = useState(STYLES[0]!);
  const [occasion, setOccasion] = useState(OCCASIONS[0]!);
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const cartProducts = useMemo(() => {
    const seen = new Set<string>();
    return items
      .map((i) => i.product)
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [items]);

  const suggestions = useMemo(() => {
    const pool = [...cartProducts, ...PRODUCTS.filter((p) => !cartProducts.some((c) => c.id === p.id))];
    const q = (query ?? "").toLowerCase();
    return pool.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [cartProducts, query]);

  const mentions = useMemo(
    () => PRODUCTS.filter((p) => prompt.includes(`@${p.name}`)).map((p) => p.id),
    [prompt],
  );

  const onPromptChange = (value: string) => {
    setPrompt(value);
    const caret = textRef.current?.selectionStart ?? value.length;
    const match = /@([^@\n]{0,30})$/.exec(value.slice(0, caret));
    setQuery(match ? match[1]! : null);
  };

  const insertMention = (name: string) => {
    const el = textRef.current;
    const caret = el?.selectionStart ?? prompt.length;
    const before = prompt.slice(0, caret).replace(/@([^@\n]{0,30})$/, "");
    const next = `${before}@${name} ${prompt.slice(caret)}`;
    setPrompt(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = before.length + name.length + 2;
      el?.setSelectionRange(pos, pos);
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          style,
          occasion,
          prompt: prompt || undefined,
          mentions: mentions.length ? mentions : undefined,
        },
      }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <div className="space-y-6 border border-border bg-card p-6">
        <Choices label="1. Phong cách" options={STYLES} value={style} onChange={setStyle} />
        <Choices label="2. Dịp sử dụng" options={OCCASIONS} value={occasion} onChange={setOccasion} />

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-silver">3. Mô tả outfit</span>
            <span className="text-[0.65rem] text-silver">
              Gõ <span className="text-primary">@</span> để nhắc sản phẩm trong giỏ
            </span>
          </div>

          {cartProducts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {cartProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => insertMention(p.name)}
                  className="flex items-center gap-2 border border-border px-3 py-1.5 text-xs text-beige hover:border-primary"
                >
                  <img src={p.image} alt="" className="size-5 object-cover" />
                  <span className="text-primary">@</span>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textRef}
              rows={4}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onBlur={() => window.setTimeout(() => setQuery(null), 120)}
              placeholder="Ví dụ: phối @Shadow Hoodie với quần cargo rộng, sneaker trắng…"
              className="mt-2 w-full resize-none border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {query !== null && suggestions.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-20 max-h-56 overflow-auto border border-border bg-card">
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertMention(p.name)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-beige hover:bg-background"
                    >
                      <img src={p.image} alt="" className="size-8 object-cover" />
                      <span className="flex-1">{p.name}</span>
                      {cartProducts.some((c) => c.id === p.id) && (
                        <span className="text-[0.6rem] uppercase tracking-[0.15em] text-primary">
                          Trong giỏ
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {mentions.length > 0 && (
            <p className="mt-2 text-xs text-silver">
              AI sẽ dùng {mentions.length} sản phẩm được nhắc để dựng outfit.
            </p>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.15em] text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? "Đang tạo concept…" : "Tạo concept outfit"}
        </button>
        {mutation.data?.text && <p className="text-sm text-beige">{mutation.data.text}</p>}
      </div>

      <ResultPanel
        image={mutation.data?.image}
        pending={mutation.isPending}
        emptyLabel="Concept outfit của bạn sẽ hiện ở đây."
      />
    </div>
  );
}


function TryOnPanel({ initialProduct }: { initialProduct?: string | undefined }) {
  const run = useServerFn(generateTryOn);
  const { add } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [productId, setProductId] = useState(
    (initialProduct && getProduct(initialProduct)?.id) || PRODUCTS[0]!.id,
  );
  const [note, setNote] = useState("");
  const product = getProduct(productId)!;

  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          personImage: person!,
          garmentImage: product.image,
          garmentName: product.name,
          note: note || undefined,
        },
      }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <div className="space-y-6 border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver">1. Ảnh của bạn</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-border py-8 text-sm text-beige hover:border-primary"
          >
            <Upload className="size-4" />
            {person ? "Đổi ảnh khác" : "Tải ảnh toàn thân (JPG/PNG)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 6_000_000) {
                toast.error("Ảnh tối đa 6MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setPerson(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
          {person && <img src={person} alt="Ảnh của bạn" className="mt-3 h-40 object-cover" />}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver">2. Chọn sản phẩm</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={`border px-3 py-2 text-xs ${
                  p.id === productId
                    ? "border-primary text-primary"
                    : "border-border text-beige hover:border-primary"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-silver">3. Ghi chú thêm</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: mặc form rộng hơn, phối cùng quần đen…"
            className="mt-2 w-full resize-none border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <button
          onClick={() => (person ? mutation.mutate() : toast.error("Hãy tải ảnh của bạn trước."))}
          disabled={mutation.isPending}
          className="w-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.15em] text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? "Đang thử đồ…" : "Thử đồ ngay"}
        </button>
      </div>

      <div className="space-y-4">
        <ResultPanel
          image={mutation.data?.image}
          pending={mutation.isPending}
          emptyLabel="Tải ảnh và chọn sản phẩm để xem bạn trong bộ đồ này."
        />
        <div className="flex items-center justify-between gap-3 border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-primary">{formatVnd(product.price)}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/product/$id"
              params={{ id: product.id }}
              className="border border-border px-3 py-2 text-xs uppercase tracking-[0.15em] text-beige hover:border-primary"
            >
              Chi tiết
            </Link>
            <button
              onClick={() => {
                add({
                  productId: product.id,
                  size: product.sizes[0]!,
                  color: product.colors[0]!,
                  qty: 1,
                });
                toast.success("Đã thêm vào giỏ");
              }}
              className="bg-primary px-3 py-2 text-xs uppercase tracking-[0.15em] text-primary-foreground"
            >
              Thêm giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-silver">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`border px-4 py-2 text-xs ${
              o === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-beige hover:border-primary"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
