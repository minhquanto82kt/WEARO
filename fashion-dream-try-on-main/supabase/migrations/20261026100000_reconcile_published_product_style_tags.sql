-- Reconcile published products with their canonical style collection tags.
-- Keep intentionally multi-style products in multiple collections; only add missing
-- tag links that match the product's explicit fashion_style value.

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t
  ON t.slug = lower(replace(p.fashion_style, ' ', '-'))
 AND t.status = 'active'
 AND t.archived_at IS NULL
WHERE p.active = true
  AND p.status = 'published'
  AND p.fashion_style IS NOT NULL
ON CONFLICT (product_id, tag_id) DO NOTHING;

-- Remove the accidental Outerwear collection assignment from the shirt record.
-- The shirt has no explicit fashion_style and is already tagged Basic and Casual.
DELETE FROM public.product_tags pt
USING public.products p, public.tags t
WHERE pt.product_id = p.id
  AND pt.tag_id = t.id
  AND p.name = 'Áo sơ mi cotton basic kinh điển'
  AND p.fashion_style IS NULL
  AND t.slug = 'outerwear';
