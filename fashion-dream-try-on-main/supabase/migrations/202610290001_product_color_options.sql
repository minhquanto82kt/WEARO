-- Product overview colors and per-variant swatch colors.
-- Existing products and variants remain valid; fields are nullable for backward compatibility.
alter table public.products
  add column if not exists color_options jsonb;

alter table public.products
  drop constraint if exists products_color_options_shape_check;

alter table public.products
  add constraint products_color_options_shape_check
  check (
    color_options is null
    or (
      jsonb_typeof(color_options) = 'object'
      and color_options->>'mode' in ('single', 'multi')
      and jsonb_typeof(color_options->'colors') = 'array'
      and jsonb_array_length(color_options->'colors') between 1 and 3
    )
  );

alter table public.product_variants
  add column if not exists color_hex text;

alter table public.product_variants
  drop constraint if exists product_variants_color_hex_check;

alter table public.product_variants
  add constraint product_variants_color_hex_check
  check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.products.color_options is
  'Presentation-level color swatches: {mode: single|multi, colors: [{name, hex}]}';
comment on column public.product_variants.color_hex is
  'Optional HEX swatch for this purchasable variant color; nullable for legacy records.';
