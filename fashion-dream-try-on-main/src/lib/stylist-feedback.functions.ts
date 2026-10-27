import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveCustomerContext } from "@/lib/customer-context.server";
import { supabaseRequest } from "@/lib/supabase.server";

const Input = z.object({
  accessToken: z.string().trim().min(1).optional(),
  sessionId: z.string().trim().min(1).max(120),
  recommendationIds: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
});
const FeedbackInput = Input.extend({
  helpful: z.boolean(),
  note: z.string().trim().max(500).optional(),
});
const EventInput = Input.extend({
  eventType: z.enum(["recommendation_view", "product_click", "add_to_cart", "purchase"]),
  productId: z.string().trim().max(120).optional(),
  orderId: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const submitStylistFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    const context = await resolveCustomerContext(data.accessToken);
    await supabaseRequest("stylist_feedback", {
      method: "POST",
      body: JSON.stringify({
        user_id: context.userId,
        session_id: data.sessionId,
        recommendation_ids: data.recommendationIds,
        helpful: data.helpful,
        note: data.note || null,
      }),
    });
    return { ok: true };
  });

export const trackStylistEvent = createServerFn({ method: "POST" })
  .validator((input: unknown) => EventInput.parse(input))
  .handler(async ({ data }) => {
    const context = await resolveCustomerContext(data.accessToken);
    await supabaseRequest("stylist_events", {
      method: "POST",
      body: JSON.stringify({
        user_id: context.userId,
        session_id: data.sessionId,
        event_type: data.eventType,
        product_id: data.productId || null,
        order_id: data.orderId || null,
        recommendation_ids: data.recommendationIds,
        metadata: data.metadata ?? {},
      }),
    });
    return { ok: true };
  });
