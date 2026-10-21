# Core Commerce Schema Reconciliation

**Environment:** Supabase production project `oazipcrbutizdncctkcg`  
**Audited:** 2026-09-13  
**Scope:** products → variants/images → orders → order_items → payments → payment_events, plus admin_users and site_theme_settings.

> This is a reconciliation/audit artifact generated from the live database. It is **not** a migration and must not be executed as SQL.

> **Historical snapshot:** audited 2026-09-13. This document's row counts, product visibility wording, order RLS summary, and product price constraint are stale relative to the 2026-10-21 live audit. Use [`2026-10-live-audit.md`](2026-10-live-audit.md) for current findings; do not treat this file as current schema authority.

## 1. Live schema summary

| Table | PK | Important FKs | RLS | Rows |
|---|---|---|---|---:|
| products | `id text` | — | ON | 11 |
| product_variants | `id uuid` | `product_id → products.id` ON DELETE CASCADE | ON | 48 |
| product_images | `id uuid` | `product_id → products.id` ON DELETE CASCADE | ON | 25 |
| orders | `id uuid` | — | ON | 18 |
| order_items | `id uuid` | `order_id → orders.id` CASCADE; `variant_id → product_variants.id` SET NULL | ON | 18 |
| payments | `id uuid` | `order_id → orders.id` RESTRICT | ON | 18 |
| payment_events | `id uuid` | `payment_id → payments.id` RESTRICT | ON | 22 |
| admin_users | `user_id uuid` | `user_id → auth.users.id` CASCADE | ON | 1 |
| site_theme_settings | `id text` | `updated_by → auth.users.id` | ON | 1 |

## 2. Products

### `products`
- `id text` PRIMARY KEY
- `name text` NOT NULL
- `description text` NULL
- `price integer` NOT NULL, `price >= 0`
- `category text` NOT NULL
- `image text` NULL
- `active boolean` NOT NULL DEFAULT `true`
- `created_at timestamptz` NOT NULL DEFAULT `now()`
- `slug text` NOT NULL, UNIQUE index `products_slug_unique`
- `short_description text` NULL
- `long_description text` NULL
- `status text` NOT NULL DEFAULT `draft`
- `featured boolean` NOT NULL DEFAULT `false`
- `updated_at timestamptz` NOT NULL DEFAULT `now()`

Indexes: category, featured=true, status, slug unique, PK.

RLS policies:
- Public (`anon`, `authenticated`) can SELECT active products.
- `authenticated` admins can INSERT/UPDATE/DELETE through `is_admin()`.

Trigger:
- `products_set_updated_at` → `set_products_updated_at()` before UPDATE.

### `product_variants`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `product_id text` NOT NULL FK to products
- `size text` NOT NULL
- `color text` NOT NULL
- `sku text` NULL UNIQUE
- `stock integer` NOT NULL DEFAULT `0`, `stock >= 0`
- `created_at timestamptz` NOT NULL DEFAULT `now()`

Unique: `(product_id, size, color)`.
Index: `product_id`.

RLS policies:
- Public (`anon`, `authenticated`) can SELECT variants whose product is active.
- `authenticated` admins can INSERT/UPDATE/DELETE through `is_admin()`.

### `product_images`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `product_id text` NOT NULL FK to products
- `image_url text` NOT NULL
- `alt_text text` NULL
- `sort_order integer` NOT NULL DEFAULT `0`
- `is_primary boolean` NOT NULL DEFAULT `false`
- `created_at timestamptz` NOT NULL DEFAULT `now()`

Unique partial index: one primary image per product (`product_id WHERE is_primary=true`).
Index: `(product_id, sort_order)`.

RLS policies:
- Public (`anon`, `authenticated`) can SELECT images belonging to active products.
- `authenticated` admins can INSERT/UPDATE/DELETE through `is_admin()`.

## 3. Orders

### `orders`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `order_code text` NOT NULL UNIQUE
- `customer_name text` NOT NULL
- `phone text` NOT NULL
- `email text` NULL
- `address text` NOT NULL
- `city text` NOT NULL
- `district text` NOT NULL
- `payment_method text` NOT NULL: `cod | vietqr | momo`
- `payment_status text` NOT NULL DEFAULT `pending`: `pending | paid | failed | refunded`
- `order_status text` NOT NULL DEFAULT `new`: `new | confirmed | shipping | completed | cancelled`
- `subtotal integer` NOT NULL, >= 0
- `shipping_fee integer` NOT NULL DEFAULT 0, >= 0
- `total integer` NOT NULL, >= 0
- `note text` NULL
- `created_at timestamptz` NOT NULL DEFAULT `now()`

Indexes: created_at DESC, order_code, unique order_code, PK.

RLS policies:
- `authenticated` admins can SELECT orders through `is_admin()`.
- `authenticated` admins can UPDATE orders through `is_admin()`.

There is no direct `user_id` FK; guest checkout/order tracking is supported separately by RPC.

## 4. Order items

### `order_items`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `order_id uuid` NOT NULL FK → orders.id ON DELETE CASCADE
- `product_id text` NOT NULL
- `product_name text` NOT NULL (snapshot)
- `size text` NOT NULL
- `color text` NOT NULL
- `quantity integer` NOT NULL, `quantity > 0`
- `unit_price integer` NOT NULL, `unit_price >= 0` (snapshot)
- `created_at timestamptz` NOT NULL DEFAULT `now()`
- `variant_id uuid` NULL FK → product_variants.id ON DELETE SET NULL

Indexes: order_id, variant_id, PK.

RLS:
- Current direct table policy only permits `authenticated` admins to SELECT via `is_admin()`.
- Inserts are performed by the `create_order_atomic` SECURITY DEFINER function rather than by a public table INSERT policy.

## 5. Payments

### `payments`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `order_id uuid` NOT NULL UNIQUE FK → orders.id ON DELETE RESTRICT
- `method text` NOT NULL: `cod | vietqr | momo`
- `status text` NOT NULL DEFAULT `pending`: `pending | paid | failed | refunded`
- `amount integer` NOT NULL, >= 0
- `transaction_ref text` NULL
- `provider text` NULL
- `provider_transaction_id text` NULL
- `paid_at timestamptz` NULL
- `failure_reason text` NULL
- `metadata jsonb` NOT NULL DEFAULT `{}`
- `created_at timestamptz` NOT NULL DEFAULT `now()`
- `updated_at timestamptz` NOT NULL DEFAULT `now()`

Indexes:
- unique order_id
- status
- transaction_ref
- provider_transaction_id
- unique `(provider, provider_transaction_id)` when both are non-null
- PK

RLS policies:
- `authenticated` admins can SELECT and UPDATE through `is_admin()`.
- Payment creation/status processing is intentionally mediated by SECURITY DEFINER backend functions.

Triggers:
- `set_payments_updated_at` before UPDATE
- `payments_record_event` after INSERT/UPDATE
- `sync_order_payment_status` after INSERT/UPDATE

## 6. Payment events

### `payment_events`
- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `payment_id uuid` NOT NULL FK → payments.id ON DELETE RESTRICT
- `event_type text` NOT NULL: `created | status_changed | provider_update | refund`
- `old_status text` NULL
- `new_status text` NULL
- `amount integer` NULL, >= 0 when present
- `transaction_ref text` NULL
- `provider_transaction_id text` NULL
- `metadata jsonb` NOT NULL DEFAULT `{}`
- `created_at timestamptz` NOT NULL DEFAULT `now()`
- `provider text` NULL
- `provider_event_id text` NULL

Indexes:
- `(payment_id, created_at DESC)`
- provider transaction id when non-null
- unique `(provider, provider_event_id)` when both are non-null
- PK

RLS:
- `authenticated` admins can SELECT through `is_admin()`.
- Events are recorded by the payment trigger/function path.

## 7. Admin identity

### `admin_users`
- `user_id uuid` PRIMARY KEY FK → `auth.users.id` ON DELETE CASCADE
- `created_at timestamptz` NOT NULL DEFAULT `now()`
- RLS is ON.
- **No RLS policy exists.** This is currently reported by the Supabase Security Advisor.

The table is read internally by `is_admin()` / `is_admin_user()` SECURITY DEFINER functions.

## 8. Theme settings

### `site_theme_settings`
- `id text` PRIMARY KEY DEFAULT `global`
- color fields: primary, secondary, background, surface, accent, foreground
- `updated_at timestamptz` NOT NULL DEFAULT `now()`
- `updated_by uuid` NULL FK → auth.users.id

RLS policies:
- Public can SELECT the `global` row.
- `authenticated` admins can INSERT/UPDATE the `global` row through `is_admin_user()`.

## 9. Commerce invariants confirmed in live DB

1. A product variant belongs to exactly one product.
2. A product can have many variants/images.
3. `(product_id, size, color)` identifies a variant combination uniquely.
4. An order can have many order items.
5. An order has at most one payment record (`payments.order_id` UNIQUE).
6. Payment events cannot outlive their payment (`ON DELETE RESTRICT`).
7. Orders/payments are protected from accidental cascading deletion.
8. Payment methods currently include COD, VietQR and MoMo.
9. Payment statuses are `pending → paid/failed → refunded` with transition enforcement in `verify_payment_status()`.
10. `sync_order_payment_status()` propagates payment status to `orders.payment_status`; a successful non-COD payment can also move a `new` order to `confirmed`.

## 10. Current findings / required follow-up

### P0 — security review required
- `process_momo_payment(...)` is SECURITY DEFINER and executable by `anon` and `authenticated`.
- `track_guest_order(...)` is SECURITY DEFINER and executable by `anon` and `authenticated` by design, but must remain tightly scoped to the minimum data returned.
- `is_admin()` / `is_admin_user()` are SECURITY DEFINER and exposed to API roles.
- Supabase Security Advisor currently flags these public SECURITY DEFINER executions.

### P1 — RLS completeness
- `admin_users` has RLS enabled but no policy. This is flagged by Security Advisor.

### P1 — function hardening
- `set_try_on_jobs_updated_at()`
- `set_product_vision_attributes_updated_at()`
- `set_site_theme_updated_at()`

These functions currently have mutable search paths and should be hardened in a dedicated security migration after dependency review.

### P2 — source-control drift
The live production database contains the core commerce schema and a long migration history, while the GitHub `supabase/migrations/` directory currently contains only the later try-on/storage/vision migrations. Therefore the live DB is ahead of the repository migration history.

**Do not reconstruct historical migrations and run them against production.** The correct next step is to create a clean, forward-only baseline/reconciliation strategy for future environments, then separately remediate the live security findings.

## 11. Decision

**M1.0.2 schema reconciliation: PASS for inspection, NOT PASS for migration synchronization.**

No production DDL/data changes were executed during this audit.
