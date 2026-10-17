import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const StylistInput = z.object({
  occasion: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
  preferences: z.object({
    colors: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
    style_tags: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
    garment_type: z.string().trim().max(50).optional(),
    max_price: z.number().min(0).optional(),
  }).default({}),
  limit: z.number().int().min(1).max(8).default(4),
});

type StylistResponse = {
  recommendations: Array<{
    product: Record<string, string | number | boolean | null | string[] | number[]>;
    score: number;
    reason: string;
  }>;
  summary: string;
  strategy: string;
};

function serverOrigin(): string {
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const forwardedProto = getRequestHeader("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host) {
    return `${forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http")}://${host}`;
  }
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000";
}

function internalSecret(): string {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new Error("Thiếu cấu hình server cho AI Stylist.");
  return secret;
}

export const getStylistRecommendations = createServerFn({ method: "POST" })
  .validator((input: unknown) => StylistInput.parse(input))
  .handler(async ({ data }) => {
    const clientKey =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestHeader("x-real-ip") ??
      "unknown";

    const response = await fetch(`${serverOrigin()}/api/stylist/internal/recommend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${internalSecret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, client_key: clientKey }),
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const detail =
        typeof payload === "object" && payload && "detail" in payload
          ? String(payload.detail)
          : text;
      throw new Error(detail || `AI Stylist backend failed (${response.status})`);
    }

    return payload as StylistResponse;
  });
