import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { generateText } from "ai";
import { z } from "zod";
import { resolveCustomerContext } from "@/lib/customer-context.server";

const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(12000),
});

const ChatInput = z.object({
  accessToken: z.string().trim().min(1).optional(),
  messages: z.array(ChatMessage).max(40),
});

const StylistResponse = z.object({
  recommendations: z.array(z.object({
    product: z.record(z.string(), z.unknown()),
    score: z.number(),
    reason: z.string(),
  })),
  summary: z.string(),
  strategy: z.string().optional(),
});

const SYSTEM_PROMPT = [
  "You are WEARO AI Stylist, the fashion assistant for WEARO.",
  "Core message: Mặc theo cách của riêng bạn.",
  "Help users discover outfits, refine personal style, and make practical fashion decisions.",
  "Be concise, specific, modern, and fashion-editorial rather than generic.",
  "Never invent catalogue products, prices, stock, orders, or customer data.",
  "When verified catalogue context is supplied, recommend only products in that context and use their exact names and prices.",
  "When catalogue context says unavailable or empty, give general styling advice without naming or pricing products; be transparent that live product matching is temporarily unavailable.",
  "Do not claim stock availability unless the supplied data explicitly includes current stock.",
].join("\n");

function serverOrigin(): string {
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const forwardedProto = getRequestHeader("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host) {
    return `${forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http")}://${host}`;
  }
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000";
}

function catalogPreferences(message: string) {
  const normalized = message.toLocaleLowerCase("vi");
  const styles = ["street", "minimal", "smart casual", "y2k"].filter((style) => normalized.includes(style));
  const colorMap: Record<string, string> = {
    "đen": "black", "black": "black",
    "trắng": "white", "white": "white",
    "be": "beige", "beige": "beige",
    "xanh navy": "navy", "navy": "navy",
    "xanh dương": "blue", "blue": "blue",
    "xám": "grey", "gray": "grey", "grey": "grey",
    "nâu": "brown", "brown": "brown",
  };
  const colors = [...new Set(Object.entries(colorMap)
    .filter(([term]) => normalized.includes(term))
    .map(([, color]) => color))];
  const occasion = ["đi học", "đi làm", "hẹn hò", "đi chơi"].find((value) => normalized.includes(value));
  let garment_type: string | undefined;
  if (/(quần|pants|jeans|shorts)/i.test(normalized)) garment_type = "bottom";
  else if (/(váy|đầm|dress)/i.test(normalized)) garment_type = "dress";
  else if (/(áo khoác|jacket|coat)/i.test(normalized)) garment_type = "outerwear";
  else if (/(áo|shirt|hoodie|top)/i.test(normalized)) garment_type = "top";

  return {
    ...(occasion ? { occasion } : {}),
    mood: message.slice(0, 100),
    preferences: {
      ...(styles.length ? { style_tags: styles } : {}),
      ...(colors.length ? { colors } : {}),
      ...(garment_type ? { garment_type } : {}),
    },
    limit: 4,
  };
}

async function getVerifiedCatalogContext(message: string): Promise<string> {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) {
    return "LIVE CATALOG STATUS: unavailable (server bridge secret is not configured). Do not invent product details.";
  }

  try {
    const clientKey =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestHeader("x-real-ip") ??
      "unknown";
    const response = await fetch(`${serverOrigin()}/api/stylist/internal/recommend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...catalogPreferences(message), client_key: clientKey }),
    });
    if (!response.ok) {
      return `LIVE CATALOG STATUS: unavailable (catalog service returned ${response.status}). Do not invent product details.`;
    }

    const parsed = StylistResponse.safeParse(await response.json());
    if (!parsed.success) {
      return "LIVE CATALOG STATUS: unavailable (catalog response was invalid). Do not invent product details.";
    }

    const products = parsed.data.recommendations.map(({ product, score, reason }) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      score,
      reason,
    })).filter((product) => typeof product.id === "string" && typeof product.name === "string");

    if (!products.length) {
      return "LIVE CATALOG STATUS: no matching active published products were returned. Give general styling advice without inventing catalogue items.";
    }

    return `VERIFIED ACTIVE PUBLISHED WEARO CATALOG (source: database; recommend only these items and preserve exact names/prices):\n${JSON.stringify(products)}`;
  } catch {
    return "LIVE CATALOG STATUS: unavailable (catalog service could not be reached). Do not invent product details.";
  }
}

async function verifyStylistEntitlement(accessToken?: string) {
  // Guests may use AI Stylist; a token is only used to identify an existing session.
  return resolveCustomerContext(accessToken);
}

export const generateWearoAiReply = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    await verifyStylistEntitlement(data.accessToken);

    const latestUserMessage = [...data.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const catalogContext = await getVerifiedCatalogContext(latestUserMessage);
    const result = await generateText({
      model: "openai/gpt-5.6-luna",
      system: `${SYSTEM_PROMPT}\n\n${catalogContext}`,
      messages: data.messages,
    });

    return { text: result.text };
  });
