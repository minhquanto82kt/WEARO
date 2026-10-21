# Supabase Live Database Reconciliation — 2026-10-21

Target project: `oazipcrbutizdncctkcg`
Repository branch: `feature/product-admin`

## Scope and safety

Read-only inspection of live Supabase migration history, public tables, selected columns/constraints/RLS policies, triggers, functions, and Storage buckets. No production DDL, data writes, or migration execution was performed.

## 1. Migration history

- Live Supabase reports **78 applied migrations**.
- First migration: `20260909011420` — `phase_1_product_cms_foundation`.
- Latest migration: `20261020085351` — `fix_appearance_themes_public_read_rls`.
- `supabase/migrations/production-manifest.json` has been refreshed to match all 78 live version/name entries.
- `supabase/migrations/` still does not contain the historical SQL bodies; it is not yet a replayable migration baseline.

**Important limitation:** the available Supabase connector exposes migration versions and names, but not the exact SQL body for every historical migration. Do not fabricate migration files from schema snapshots. Export the exact bodies from their original source, Supabase CLI, or a trusted backup before creating a replayable baseline.

## 2. Live table coverage

The live database contains **28 public base tables**. The existing nine schema snapshots represent 11 tables; these 17 live tables are not yet represented by dedicated snapshots:

- `ai_usage_daily`
- `appearance_branding`
- `appearance_palettes`
- `appearance_themes`
- `cart_items`
- `carts`
- `inventory_movements`
- `journal_articles`
- `product_reviews`
- `product_tags`
- `site_content_settings`
- `site_theme_settings`
- `tags`
- `user_roles`
- `user_vouchers`
- `vouchers`
- `wishlist_items`

## 3. Verified schema details

- `products` has 16 rows, `new_arrival`, `fashion_style`, and a live `price >= 1000` check. Allowed non-null fashion styles are `Casual`, `Basic`, `Streetwear`, and `Outing Style`.
- `product_variants` has 71 rows; stock must be non-negative. Its product foreign key cascades on product deletion. Inventory changes are also recorded in `inventory_movements`.
- `orders` has 25 rows and includes `user_id`, `idempotency_key`, `voucher_id`, `voucher_code`, and `discount_amount`. Its current payment-method check allows `cod`, `vietqr`, and `momo`.
- `order_items` has 27 rows. `variant_id` references `product_variants` with `ON DELETE SET NULL`, preserving the order line if a variant is removed.
- `payments` has 25 rows. `order_id` is unique and uses `ON DELETE RESTRICT`; its current method check allows `cod`, `vietqr`, and `momo`.
- The payment workflow has payment-event and order-status synchronization triggers. Order creation and provider payment processing are handled through controlled RPC paths.

## 4. RLS and function security

RLS is enabled on the inspected public tables. Important live authorization rules include:

- Public catalog reads require `active = true` and `status = 'published'` for products, variants, and product images.
- Product, variant, and image mutations use `has_backoffice_role('admin'::app_role)`.
- Order reads are scoped to the owner or backoffice staff; order updates are admin-restricted.
- Payment reads are scoped to the manager role; payment updates and payment-event reads are admin-restricted.
- Cart policies scope authenticated users to their own carts and cart items.
- `appearance_themes` has separate published-theme and admin-read policies. Supabase's performance advisor reports multiple permissive SELECT policies for authenticated users; this should be reviewed, but is not by itself proof of an authorization vulnerability.

Security-definer functions cover order creation/cancellation, payment verification, SePay/MoMo processing, guest order tracking, RBAC, inventory audit, appearance publishing, and AI quota accounting. A full parity review still needs exact function bodies, execute grants, `search_path`, every RLS policy, and Storage policies.

## 5. Storage buckets observed

| Bucket | Public | Limit | Allowed MIME types |
|---|---|---:|---|
| `ai-results` | no | 10 MB | JPEG/PNG/WebP |
| `email-assets` | yes | none reported | none reported |
| `product-images` | yes | 10 MB | JPEG/PNG/WebP/GIF |
| `site-branding` | yes | 2 MB | PNG/JPEG/WebP/SVG |
| `try-on-assets` | no | 10 MB | JPEG/PNG/WebP |

## 6. Required completion path

1. Export all 78 exact historical SQL migration bodies from the original source / Supabase CLI / trusted backup.
2. Commit the files unchanged and in timestamp order.
3. Add reference snapshots for the 17 missing tables and cover constraints, indexes, RLS, grants, RPCs, triggers, and Storage policies.
4. Replay the real migration history in a disposable non-production database.
5. Compare its schema/security catalog against production and run application integration tests.
6. Only then consider any production migration.

## Result

The live migration manifest is current. The schema snapshots and migration baseline are not yet fully synchronized. No production data or schema was changed during this audit.