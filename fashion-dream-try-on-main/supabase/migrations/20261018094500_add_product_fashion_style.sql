-- Store the merchandising style selected by the admin for each product.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fashion_style text;

ALTER TABLE public.products
  ADD CONSTRAINT products_fashion_style_check
  CHECK (fashion_style IS NULL OR fashion_style IN ('Casual', 'Basic', 'Streetwear', 'Outing Style'));
