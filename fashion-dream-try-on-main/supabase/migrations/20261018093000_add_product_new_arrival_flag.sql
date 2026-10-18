-- Explicit merchandising flag for New Arrivals.
-- Existing products default to false so the label is opt-in.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS new_arrival boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_new_arrival_published_idx
  ON public.products (created_at DESC)
  WHERE new_arrival = true AND status = 'published' AND active = true;
