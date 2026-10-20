-- Prevent product prices below VND 1,000 at the database layer.
-- Admin forms also validate this rule for a clear message before saving.
ALTER TABLE public.products
  ADD CONSTRAINT products_price_minimum_1000
  CHECK (price >= 1000);
