-- Add standardized gender metadata for customer-facing product information.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'Unisex';

-- Existing products default to Unisex; constrain values to the supported options.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_gender_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_gender_check
  CHECK (gender IN ('Male', 'Female', 'Unisex'));

CREATE INDEX IF NOT EXISTS products_gender_idx
  ON public.products (gender);
