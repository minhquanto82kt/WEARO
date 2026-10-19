import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { generateImage } from "ai";
import { z } from "zod";
import { getAiTryOnEnabled } from "@/lib/feature-flags.server";
import { assertTryOnEntitlement, resolveCustomerContext } from "@/lib/customer-context.server";

const CONCEPT_IMAGE_MODEL = "openai/gpt-image-2.5-flare";
const CONCEPT_IMAGE_FALLBACK_MODEL = "openai/gpt-image-2.5-sunburst";
const MAX_PERSON_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_NOTE_LENGTH = 400;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type GeneratedImage = { image: string; text: string };
type DbProduct = { id: string; name: string; category: string; price: number; image: string | null; active: boolean; status: string };
type DbProductImage = { product_id: string; image_url: string; sort_order: number; is_primary: boolean };
type DbVariant = { product_id: string; size: string; color: string; stock: number };

type InternalTryOnJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  provider: string;
  result_image_url?: string | null;
  error?: string | null;
};

async function generateFashionImage(prompt: string, images: string[] = []): Promise<GeneratedImage> {
  const imagePrompt = images.length ? { text: prompt, images } : prompt;
  const models = [...new Set([CONCEPT_IMAGE_MODEL, CONCEPT_IMAGE_FALLBACK_MODEL])];
  const failures: string[] = [];

  for (const model of models) {
    try {
      const result = await generateImage({ model, prompt: imagePrompt, n: 1 });
      const image = result.image;
      if (!image) throw new Error("AI không trả về hình ảnh.");
      return { image: `data:${image.mediaType};base64,${image.base64}`, text: "" };
    } catch (error) {
      const detail = error instanceof Error ? error.message.slice(0, 300) : "unknown provider error";
      failures.push(`${model}: ${detail}`);
      console.error("AI image generation model failed:", model, error);
    }
  }

  throw new Error(`AI tạo ảnh thất bại với cả model chính và dự phòng. ${failures.join(" | ")}`);
}

async function getPublishedProduct(productId?: string) {
  if (!productId?.trim()) throw new Error("Thiếu sản phẩm thử đồ.");
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const products = await supabaseRequest<DbProduct[]>(`products?id=eq.${encodeURIComponent(productId)}&active=eq.true&status=eq.published&select=id,name,category,price,image,active,status&limit=1`);
  const product = products[0];
  if (!product) throw new Error("Sản phẩm không tồn tại hoặc chưa được xuất bản.");
  const images = await supabaseRequest<DbProductImage[]>(`product_images?product_id=eq.${encodeURIComponent(product.id)}&select=product_id,image_url,sort_order,is_primary&order=sort_order.asc`);
  const garmentImage = images.find((image) => image.is_primary)?.image_url ?? images[0]?.image_url ?? product.image;
  if (!garmentImage) throw new Error("Sản phẩm chưa có hình ảnh để thử đồ.");
  return { product, garmentImage };
}

export const listAiProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseRequest } = await import("@/lib/supabase.server");
  const products = await supabaseRequest<DbProduct[]>("products?active=eq.true&status=eq.published&select=id,name,category,price,image&order=created_at.desc");
  if (!products.length) return [];

  const productIds = products.map((product) => product.id);
  const idFilter = productIds.join(",");
  const [images, variants] = await Promise.all([
    supabaseRequest<DbProductImage[]>(`product_images?product_id=in.(${idFilter})&select=product_id,image_url,sort_order,is_primary&order=sort_order.asc&limit=1000`),
    supabaseRequest<DbVariant[]>(`product_variants?product_id=in.(${idFilter})&select=product_id,size,color,stock&order=size.asc,color.asc&limit=5000`),
  ]);

  const imagesByProduct = new Map<string, DbProductImage[]>();
  for (const image of images) {
    const bucket = imagesByProduct.get(image.product_id) ?? [];
    bucket.push(image);
    imagesByProduct.set(image.product_id, bucket);
  }
  const variantsByProduct = new Map<string, DbVariant[]>();
  for (const variant of variants) {
    const bucket = variantsByProduct.get(variant.product_id) ?? [];
    bucket.push(variant);
    variantsByProduct.set(variant.product_id, bucket);
  }

  return products.flatMap((product) => {
    const productImages = imagesByProduct.get(product.id) ?? [];
    const productVariants = variantsByProduct.get(product.id) ?? [];
    const image = productImages.find((item) => item.is_primary)?.image_url ?? productImages[0]?.image_url ?? product.image;
    const availableVariants = productVariants.filter((item) => item.stock > 0);
    const defaultVariant = availableVariants[0] ?? productVariants[0];
    if (!image || !defaultVariant) return [];
    return [{
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image,
      defaultVariant: { size: defaultVariant.size, color: defaultVariant.color },
      variants: productVariants,
    }];
  });
});

const ConceptInput = z.object({ style: z.string().trim().min(1).max(40), occasion: z.string().trim().min(1).max(40), prompt: z.string().trim().max(600).optional(), mentions: z.array(z.string().trim().min(1).max(100)).max(8).optional() });

export const generateConcept = createServerFn({ method: "POST" })
  .validator((input: unknown) => ConceptInput.parse(input))
  .handler(async ({ data }) => {
    const mentioned = data.mentions?.length ? await Promise.all(data.mentions.map((id) => getPublishedProduct(id))) : [];
    const items = mentioned.map(({ product }) => `${product.name} (${product.category})`).join(" | ");
    const prompt = [
      "Create a premium full-body fashion editorial photograph for the WEARO fashion brand.",
      "The image is an original fashion concept, not a product listing.",
      `Style: ${data.style}.`,
      `Occasion: ${data.occasion}.`,
      items ? `The outfit MUST feature these published WEARO clothing pieces: ${items}.` : "",
      data.prompt ? `Additional creative direction: ${data.prompt}.` : "",
      "Modern casual unisex fashion aesthetic for both men and women.",
      "WEARO design language: slate blue, dusty blue, warm peach, dusty beige and coral accents on warm ivory neutrals.",
      "Contemporary Vietnamese urban lifestyle context, with natural everyday styling rather than costume-like streetwear.",
      "Natural editorial lighting.",
      "35mm fashion photography.",
      "Realistic fabric texture, stitching and garment construction.",
      "Sharp subject detail with a refined contemporary fashion-magazine composition.",
      "No text.",
      "No watermark.",
    ].filter(Boolean).join(" ");
    return generateFashionImage(prompt);
  });

const TryOnInput = z.object({
  accessToken: z.string().trim().min(1).max(5000).optional(),
  personImage: z.string().min(20).max(8_500_000),
  productId: z.string().trim().min(1).max(100),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});

function mapTryOnCategory(category: string): "top" | "bottom" | "dress" | "outerwear" | "full_body" {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes("bottom") || normalized.includes("quần") || normalized.includes("pants") || normalized.includes("short")) return "bottom";
  if (normalized.includes("dress") || normalized.includes("váy") || normalized.includes("đầm")) return "dress";
  if (normalized.includes("outer") || normalized.includes("jacket") || normalized.includes("áo khoác") || normalized.includes("coat")) return "outerwear";
  if (normalized.includes("full") || normalized.includes("set") || normalized.includes("outfit")) return "full_body";
  return "top";
}

function serverOrigin(): string {
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const forwardedProto = getRequestHeader("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host) return `${forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http")}://${host}`;
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000";
}

function internalSecret(): string {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new Error("Thiếu cấu hình server cho AI Try-On.");
  return secret;
}

async function internalTryOnRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${serverOrigin()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${internalSecret()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const detail = typeof payload === "object" && payload && "detail" in payload ? String(payload.detail) : text;
    throw new Error(detail || `AI Try-On backend failed (${response.status})`);
  }
  return payload as T;
}

export const generateTryOn = createServerFn({ method: "POST" })
  .validator((input: unknown) => TryOnInput.parse(input))
  .handler(async ({ data }) => {
    const context = assertTryOnEntitlement(await resolveCustomerContext(data.accessToken));
    const enabled = await getAiTryOnEnabled();
    if (!enabled) throw new Error("AI Virtual Try-On hiện đang tạm tắt. Vui lòng thử lại sau.");
    validatePersonImage(data.personImage);
    const { product, garmentImage } = await getPublishedProduct(data.productId);
    const clientKey = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? getRequestHeader("x-real-ip") ?? "unknown";
    const job = await internalTryOnRequest<InternalTryOnJob>("/api/try-on/internal/jobs", {
      method: "POST",
      body: JSON.stringify({
        person_image: data.personImage,
        garment_image_url: garmentImage,
        category: mapTryOnCategory(product.category),
        note: data.note,
        client_key: clientKey,
      }),
    });
    return { jobId: job.id, status: job.status, plan: context.plan };
  });

export const getTryOnJob = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ jobId: z.string().trim().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const job = await internalTryOnRequest<InternalTryOnJob>(`/api/try-on/internal/jobs/${encodeURIComponent(data.jobId)}`, { method: "GET" });
    if (job.status === "completed" && !job.result_image_url) throw new Error("AI hoàn tất nhưng không trả về ảnh kết quả.");
    if (job.status === "failed") throw new Error(job.error || "AI Try-On thất bại. Vui lòng thử lại.");
    return { jobId: job.id, status: job.status, image: job.result_image_url ?? null, text: "" };
  });

function validatePersonImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Ảnh phải là JPG, PNG hoặc WEBP hợp lệ.");
  const [, mimeType, base64] = match;
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) throw new Error("Định dạng ảnh chưa được hỗ trợ.");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((base64.length * 3) / 4) - padding;
  if (byteLength <= 0 || byteLength > MAX_PERSON_IMAGE_BYTES) throw new Error("Ảnh tối đa 6MB.");
}
