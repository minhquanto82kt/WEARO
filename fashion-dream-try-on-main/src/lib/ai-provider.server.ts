import { generateImage } from "ai";
import { fetchWithTimeoutAndRetry } from "@/lib/server-reliability";

export type AiImageInput = {
  prompt: string;
  images?: string[];
};

export type AiImageOutput = {
  base64: string;
  mediaType: string;
};

export type AiProvider = {
  name: string;
  generateImage(input: AiImageInput): Promise<AiImageOutput>;
};

const OPENAI_IMAGE_MODEL = process.env.AI_IMAGE_MODEL?.trim() || "openai/gpt-image-2.5-flare";
const REPLICATE_MODEL = process.env.REPLICATE_TRYON_MODEL?.trim() || "prunaai/p-image-try-on";
const MAX_PROVIDER_ATTEMPTS = 2;
const REPLICATE_WAIT_SECONDS = 40;
const REPLICATE_DEADLINE_MS = 45_000;

type ReplicatePrediction = {
  id?: string;
  status?: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
};

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return /timeout|timed out|429|rate.?limit|502|503|504|temporar|network|fetch failed/.test(message);
}

function requireReplicateToken() {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("Replicate is selected but REPLICATE_API_TOKEN is not configured on the server.");
  }
  return token;
}

function replicateModelPath(model: string) {
  const normalized = model.trim().replace(/^\/+|\/+$/g, "");
  if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9._-]*$/i.test(normalized)) {
    throw new Error("REPLICATE_TRYON_MODEL must use the owner/model format.");
  }
  return normalized;
}

function extractImageUrl(output: ReplicatePrediction["output"]): string {
  const candidate = Array.isArray(output) ? output[0] : output;
  if (typeof candidate !== "string") {
    throw new Error("Replicate completed without returning an image URL.");
  }
  const url = new URL(candidate);
  if (url.protocol !== "https:") {
    throw new Error("Replicate returned an unsupported image URL.");
  }
  return url.toString();
}

async function readReplicateError(response: Response) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text) as { detail?: unknown; error?: unknown };
    const detail = payload.detail ?? payload.error;
    return typeof detail === "string" ? detail.slice(0, 500) : `Replicate API request failed (${response.status}).`;
  } catch {
    return `Replicate API request failed (${response.status}).`;
  }
}

async function fetchReplicateImage(url: string): Promise<AiImageOutput> {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || !(parsedUrl.hostname === "replicate.delivery" || parsedUrl.hostname.endsWith(".replicate.delivery"))) {
    throw new Error("Replicate returned an unsupported image host.");
  }
  const response = await fetchWithTimeoutAndRetry(parsedUrl, {}, { timeoutMs: 8_000, retries: 0 });
  if (!response.ok) throw new Error(`Could not download Replicate output (${response.status}).`);

  const mediaType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "image/webp";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mediaType)) {
    throw new Error("Replicate returned a non-image output.");
  }
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > 20 * 1024 * 1024) throw new Error("Replicate output exceeds the 20MB limit.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.byteLength > 20 * 1024 * 1024) {
    throw new Error("Replicate output is empty or exceeds the 20MB limit.");
  }
  // The API's output URL is time-limited; download it immediately so the existing
  // Supabase storage pipeline remains the source of truth for generated images.
  return { base64: Buffer.from(bytes).toString("base64"), mediaType };
}

const replicateProvider: AiProvider = {
  name: "replicate",
  async generateImage(input) {
    const token = requireReplicateToken();
    const model = replicateModelPath(REPLICATE_MODEL);
    const images = input.images ?? [];
    if (images.length < 2) {
      throw new Error("Replicate Virtual Try-On requires a person image and a garment image.");
    }

    const startedAt = Date.now();
    const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: `wait=${REPLICATE_WAIT_SECONDS}`,
      },
      body: JSON.stringify({
        input: {
          person_image: images[0],
          garment_images: [images[1]],
          prompt: input.prompt,
          output_format: "webp",
          output_quality: 90,
          preserve_input_size: true,
          turbo: true,
        },
      }),
      signal: AbortSignal.timeout((REPLICATE_WAIT_SECONDS + 5) * 1000),
    });

    if (!response.ok) throw new Error(await readReplicateError(response));
    let prediction = (await response.json()) as ReplicatePrediction;
    const deadline = startedAt + REPLICATE_DEADLINE_MS;
    while (prediction.status === "starting" || prediction.status === "processing") {
      if (!prediction.urls?.get || Date.now() >= deadline) {
        throw new Error("Replicate is still processing this try-on. Please retry in a moment.");
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const poll = await fetchWithTimeoutAndRetry(prediction.urls.get, {
        headers: { Authorization: `Bearer ${token}` },
      }, { timeoutMs: 4_000, retries: 1 });
      if (!poll.ok) throw new Error(await readReplicateError(poll));
      prediction = (await poll.json()) as ReplicatePrediction;
    }

    if (prediction.status !== "succeeded") {
      const detail = typeof prediction.error === "string" ? prediction.error.slice(0, 300) : "unknown provider error";
      throw new Error(`Replicate try-on ${prediction.status ?? "failed"}: ${detail}`);
    }

    const imageUrl = extractImageUrl(prediction.output);
    return fetchReplicateImage(imageUrl);
  },
};

const openAiGatewayProvider: AiProvider = {
  name: "openai-gateway",
  async generateImage(input) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
      try {
        const prompt = input.images?.length ? { text: input.prompt, images: input.images } : input.prompt;
        const result = await generateImage({
          model: OPENAI_IMAGE_MODEL,
          prompt,
          n: 1,
        });
        const image = result.image;
        if (!image?.base64) throw new Error("AI provider returned no image.");
        return { base64: image.base64, mediaType: image.mediaType };
      } catch (error) {
        lastError = error;
        if (attempt >= MAX_PROVIDER_ATTEMPTS || !isRetryable(error)) break;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("AI image provider failed.");
  },
};

export function getAiImageProvider(): AiProvider {
  const provider = process.env.AI_IMAGE_PROVIDER?.trim().toLowerCase() || "openai";
  if (provider === "openai" || provider === "openai-gateway") return openAiGatewayProvider;
  if (provider === "replicate") return replicateProvider;
  throw new Error(`Unsupported AI_IMAGE_PROVIDER: ${provider}`);
}
