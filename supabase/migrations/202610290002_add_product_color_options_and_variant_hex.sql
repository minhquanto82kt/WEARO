-- Product color metadata and variant-level color identity.
-- color_options matches the existing admin payload: { mode, colors: [{name, hex}] }.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_options jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS color_hex text;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_color_hex_format_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_color_hex_format_check
  CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_options_array_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_options_shape_check;
ALTER TABLE public.products ADD CONSTRAINT products_color_options_shape_check CHECK (
  color_options = '[]'::jsonb OR (
    jsonb_typeof(color_options) = 'object'
    AND color_options ? 'mode'
    AND color_options->>'mode' IN ('single', 'multi')
    AND jsonb_typeof(color_options->'colors') = 'array'
    AND jsonb_array_length(color_options->'colors') BETWEEN 1 AND 3
  )
);
COMMENT ON COLUMN public.products.color_options IS
  'Display metadata using {mode, colors:[{name,hex}]}; multi-color products may contain 2-3 colors.';
COMMENT ON COLUMN public.product_variants.color_hex IS
  'Hex color for the purchasable variant; color and size remain variant identity attributes.';
