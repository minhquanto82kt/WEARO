-- Rename the former Outing Style merchandising value to Outerwear.
-- Preserve product-to-tag assignments while moving the legacy style tag to the canonical tag.

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_fashion_style_check;

UPDATE public.products
SET fashion_style = 'Outerwear'
WHERE fashion_style = 'Outing Style';

ALTER TABLE public.products
  ADD CONSTRAINT products_fashion_style_check
  CHECK (fashion_style IS NULL OR fashion_style IN ('Casual', 'Basic', 'Streetwear', 'Outerwear'));

DO $$
DECLARE
  legacy_tag_id uuid;
  outerwear_tag_id uuid;
BEGIN
  SELECT id INTO legacy_tag_id
  FROM public.tags
  WHERE slug = 'outing-style'
  LIMIT 1;

  SELECT id INTO outerwear_tag_id
  FROM public.tags
  WHERE slug = 'outerwear'
  LIMIT 1;

  IF legacy_tag_id IS NOT NULL AND outerwear_tag_id IS NOT NULL THEN
    INSERT INTO public.product_tags (product_id, tag_id)
    SELECT product_id, outerwear_tag_id
    FROM public.product_tags
    WHERE tag_id = legacy_tag_id
    ON CONFLICT (product_id, tag_id) DO NOTHING;

    DELETE FROM public.product_tags
    WHERE tag_id = legacy_tag_id;

    UPDATE public.tags
    SET status = 'inactive',
        archived_at = COALESCE(archived_at, now()),
        updated_at = now()
    WHERE id = legacy_tag_id;
  ELSIF legacy_tag_id IS NOT NULL AND outerwear_tag_id IS NULL THEN
    UPDATE public.tags
    SET name = 'Outerwear',
        slug = 'outerwear',
        description = 'Các lớp trang phục khoác ngoài.',
        status = 'active',
        archived_at = NULL,
        updated_at = now()
    WHERE id = legacy_tag_id;
  END IF;
END;
$$;
