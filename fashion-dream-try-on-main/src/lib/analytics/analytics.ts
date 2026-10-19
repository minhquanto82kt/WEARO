export const GROWTH_EVENTS = {
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  CHECKOUT_START: "checkout_start",
  PURCHASE_COMPLETE: "purchase_complete",
  AI_TRY_ON_START: "ai_try_on_start",
  AI_RESULT_COMPLETE: "ai_result_complete",
} as const;

export type GrowthEventName = (typeof GROWTH_EVENTS)[keyof typeof GROWTH_EVENTS];

export type GrowthEvent = {
  name: GrowthEventName;
  productId?: string;
  orderId?: string;
  value?: number;
  currency?: string;
};

/**
 * First-party event boundary. Keeping this provider-neutral prevents a future
 * analytics vendor from becoming coupled to the product UX or business logic.
 */
export function trackGrowthEvent(event: GrowthEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wearo:growth", { detail: event }));
}
