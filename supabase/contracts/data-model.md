# WEARO / Fashion Dream Try-On Shop — Database Contract

This document is the shared contract for frontend, API/server functions, AI workflows, admin UI, and Supabase SQL. It describes the current live architecture as audited from Supabase on 2026-10-21. It is not a replacement for the authoritative production migration history.

## 1. Core relationship map

```text
products
   │
   ├──< product_variants ──< inventory_movements
   │
   ├──< product_images
   │
   ├──< product_tags >── tags
   │
   ├──< product_reviews
   │
   └──1 product_vision_attributes

carts ──< cart_items >── product_variants

orders
   ├──< order_items >── product_variants
   └──1 payments ──< payment_events

vouchers ──< user_vouchers
orders ──> vouchers

wishlist_items >── products

auth.users
   ├──< admin_users
   ├──< user_roles
   ├──< try_on_jobs
   ├──< product_reviews
   ├──< user_vouchers
   └──< wishlist_items

site_branding ──> storage.objects (site-branding/logo)
site_content_settings ──> editable site content
site_theme_settings ──> global theme
appearance_branding ──> branding metadata
appearance_palettes ──> reusable palettes
appearance_themes ──> draft/published themes
ai_usage_daily ──> AI quota accounting
```

## 2. Entity contract

| Entity | Primary key | Owner/source of truth | Public read | Normal write path | Delete policy |
|---|---|---|---|---|---|
| `products` | `id` text | Supabase | Published + active catalog | Admin/backoffice boundary | Avoid deleting referenced history |
| `product_variants` | `id` uuid | Supabase | Published/active catalog | Admin/backoffice boundary | Admin-controlled |
| `product_images` | `id` uuid | Storage + table metadata | Published/active catalog | Admin/backoffice boundary | Admin-controlled |
| `inventory_movements` | `id` uuid | Supabase audit log | Backoffice only | Controlled inventory operations/triggers | Append-only history |
| `product_vision_attributes` | `product_id` | AI/product-vision pipeline | Public in current live policy | Privileged AI/server path | Regenerate rather than casually delete |
| `carts` | `id` uuid | Supabase | Owner only | Authenticated user | User/cart lifecycle |
| `cart_items` | `id` uuid | Supabase | Owner only | Authenticated user | User/cart lifecycle |
| `orders` | `id` uuid | Supabase | Owner/backoffice | Atomic order RPC / controlled update | No normal hard delete |
| `order_items` | `id` uuid | Supabase | Owner/backoffice | Atomic order RPC | Cascade with order by current schema |
| `payments` | `id` uuid | Supabase | Manager/backoffice policy | Payment/RPC/server boundary | No normal hard delete |
| `payment_events` | `id` uuid | Supabase | Admin only | Payment trigger/provider path | Append-only audit history |
| `admin_users` | `user_id` uuid | Privileged admin workflow | Self-read only | Privileged workflow | Managed carefully |
| `user_roles` | `user_id` + role | Supabase RBAC | Own role/admin | Admin workflow | Role-governed |
| `try_on_jobs` | `id` uuid | Supabase job state | Own user | Authenticated/server path | Retain according to product policy |
| `product_reviews` | `id` uuid | Supabase | Published reviews | Verified buyer/backoffice | User/backoffice policy |
| `journal_articles` | `id` uuid | Supabase | Published articles | Admin draft/publish workflow | Archive/draft workflow |
| `tags` | `id` uuid | Supabase | Admin in current policy | Admin workflow | Admin-controlled |
| `product_tags` | composite product/tag | Supabase | Admin in current policy | Admin workflow | Admin-controlled |
| `vouchers` | `id` uuid | Supabase | Active vouchers to members | Admin/server workflow | Avoid deleting historical references |
| `user_vouchers` | `id` uuid | Supabase | Own user | Authenticated user | Lifecycle/status based |
| `wishlist_items` | `id` uuid | Supabase | Own user | Authenticated user | User CRUD |
| `site_branding` | `id` text | Supabase | Public read | Admin update | Keep singleton `global` record |
| `site_content_settings` | `id` text | Supabase | Public read | Admin publish/draft workflow | Keep singleton `global` record |
| `site_theme_settings` | `id` text | Supabase | Public global theme | Admin update | Keep singleton `global` record |
| `appearance_branding` | `id` text | Supabase | Admin in current policy | Admin workflow | Keep singleton `global` record |
| `appearance_palettes` | `id` uuid | Supabase | Admin in current policy | Admin workflow | Archive/delete by policy |
| `appearance_themes` | `id` uuid | Supabase | Published theme/public; admin draft | Theme workflow RPC | Publish/archive workflow |
| `ai_usage_daily` | usage date + client key | Supabase | Service-side | AI quota RPC | Operational accounting |

## 3. Product/catalog invariants

- `products.slug` is unique in the live architecture.
- Product price is a non-negative integer.
- `product_variants.stock` is the current inventory balance/source used by catalog/order logic.
- `inventory_movements` is the inventory audit/history layer; it does not replace the current stock balance.
- `(product_id, size, color)` is unique for variants.
- SKU is unique when present.
- Product images are ordered by `sort_order`.
- At most one product image is primary per product.
- Live public catalog visibility for products, images, and variants uses `active = true` and `status = 'published'`.

## 4. Order invariants

- `orders.order_code` is unique.
- `order_items.order_id` references `orders.id`.
- Order items preserve product name, size, color, quantity, and unit price as historical snapshots.
- Quantity must be greater than zero.
- Unit price, subtotal, shipping fee, discount, and total must remain non-negative under the live constraints/RPC logic.
- Customer order creation is controlled by the atomic order RPC path rather than a public direct table insert.
- Order history is financial/business history and must not be hard-deleted as ordinary CRUD.
- Customer/guest tracking is exposed only through the controlled function path and its execute grants.

## 5. Payment invariants

```text
Order
  ↓
Payment(pending)
  ↓
Provider verification / server processing
  ↓
Payment(paid|failed|refunded)
  ↓
Payment event audit
  ↓
Order payment/order-status synchronization
```

- A payment belongs to exactly one order in the current schema (`unique(order_id)`).
- Live providers include SePay and MoMo; Mastercard is represented in the payment method contract.
- Provider transaction/event identifiers are protected against duplicate processing where defined.
- `payment_events` is an audit trail and should be append-only from application perspective.
- Opening a QR page or creating a pending payment must never by itself mark an order as paid.
- Payment verification must occur through the controlled server/database function path.

## 6. Authorization / RBAC contract

```text
Public/anon
  └── published catalog/content/theme reads allowed by RLS

Authenticated customer
  ├── own cart
  ├── own wishlist
  ├── own vouchers
  ├── eligible product reviews
  └── own try-on jobs

Backoffice staff/manager/admin
  ├── catalog operations according to app_role
  ├── order operational reads/updates according to role
  ├── payment reads/updates according to role
  ├── inventory audit reads
  ├── reviews/tags/content/theme workflows
  └── admin-only storage mutations

Privileged/server path
  ├── role/admin membership operations
  ├── payment provider processing
  ├── AI quota/provider operations
  └── security-definer workflow functions
```

RLS is the database authorization boundary. Client-side route guards are UX controls, not a substitute for RLS.

The live database contains both `admin_users` helpers and the newer `user_roles` / `app_role` / `has_backoffice_role(...)` model. Do not replace one with the other without auditing all existing policies and RPCs.

## 7. AI Try-On contract

`try_on_jobs` represents asynchronous job state, not provider credentials.

```text
Input image paths
   ↓
queued
   ↓
processing
   ├──> completed + result_image_path
   └──> failed + error
```

Provider secrets remain server-side. Storage paths are metadata and must not be treated as credentials.

`ai_usage_daily` and the quota RPCs are part of the live AI operational boundary.

## 8. Storage contract

The live project currently has:

- `ai-results` — private, image results
- `email-assets` — public
- `product-images` — public catalog images
- `site-branding` — public branding/logo object
- `try-on-assets` — private try-on input/assets

Storage bucket configuration and `storage.objects` policies are part of the security boundary and must be version-controlled with migrations.

## 9. Known reconciliation items

1. The repository's original 9 schema snapshots do not cover all 28 live public tables.
2. `inventory_movements` exists in production and should be documented as the audit layer around `product_variants.stock`.
3. Live RBAC includes `user_roles`, `app_role`, `has_backoffice_role(...)`, and role-scoped policies beyond the older `is_admin()` model.
4. Live commerce includes carts, reviews, tags, vouchers, wishlist, and site appearance/content workflows that were absent from the original snapshot set.
5. Production currently has 78 migrations. `supabase/migrations/production-manifest.json` records their versions/names, but the SQL bodies must be exported before a replayable migration history is committed.
6. Do not manufacture a `000_baseline.sql` by concatenating or renaming schema snapshots.

## 10. Change protocol

For every database change:

1. Identify entity/table and current live schema.
2. Identify CREATE/READ/UPDATE/DELETE owner.
3. Check primary/foreign keys and existing constraints.
4. Check RLS, grants, and storage policies.
5. Check dependent RPC/functions/triggers and `SECURITY DEFINER` behavior.
6. Check frontend/API callers.
7. Prefer additive, backward-compatible changes.
8. Test on non-production.
9. Verify live response and UI refresh behavior.
10. Export/record the resulting migration in Git.
11. Only then promote to production.
