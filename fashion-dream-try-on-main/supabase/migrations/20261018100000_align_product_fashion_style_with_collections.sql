-- Align existing product style values with the four styles used by the WEARO header.
-- Legacy values are mapped to the closest current merchandising category.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_fashion_style_check;

UPDATE public.products
SET fashion_style = CASE fashion_style
  WHEN 'Street' THEN 'Streetwear'
  WHEN 'Minimal' THEN 'Basic'
  WHEN 'Smart casual' THEN 'Casual'
  WHEN 'Y2K' THEN 'Outing Style'
  ELSE fashion_style
END
WHERE fashion_style IN ('Street', 'Minimal', 'Smart casual', 'Y2K');

ALTER TABLE public.products
  ADD CONSTRAINT products_fashion_style_check
  CHECK (fashion_style IS NULL OR fashion_style IN ('Casual', 'Basic', 'Streetwear', 'Outing Style'));

CREATE INDEX IF NOT EXISTS products_fashion_style_idx
  ON public.products (fashion_style)
  WHERE fashion_style IS NOT NULL;
