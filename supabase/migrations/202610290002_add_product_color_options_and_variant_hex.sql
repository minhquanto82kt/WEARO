-- Product color metadata and variant-level color identity.
-- Safe to re-run; legacy products/variants remain valid.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS color_hex text;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_color_hex_format_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_color_hex_format_check CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_options_array_check;
ALTER TABLE public.products ADD CONSTRAINT products_color_options_array_check CHECK (jsonb_typeof(color_options) = 'array');
COMMENT ON COLUMN public.products.color_options IS 'Display color metadata: JSON array of {name, hex}; multi-color products may contain 2-3 entries.';
COMMENT ON COLUMN public.product_variants.color_hex IS 'Hex color for the purchasable variant; color and size remain the variant identity attributes.';
