# `src/lib` — Application Logic

This directory contains shared application logic used by routes and UI components. Keep one source of truth for each responsibility and keep server-only code separate from browser-safe helpers.

## Current refactor status

The first low-risk domain migration has been applied on `feature/product-admin`:

- Implementations for appearance branding, content, palettes, and theme workflow now live in `appearance/`.
- Customer order, cancellation, and admin order server functions now live in `orders/`.
- The original root-level paths remain as compatibility re-exports, so existing imports can continue working while consumers are migrated deliberately.
- `theme.ts` remains at the root because it imports global style sheets and branding side effects and is used as a shared theme entry point.
- No Supabase modules have been moved or merged. The two similarly named user-Supabase modules expose different APIs and need a complete caller/security review first.
- AI server functions have not been moved yet; their server-function boundaries and dynamic imports need dedicated checks.

## Current top-level modules by domain

### AI and try-on
- `ai-jobs.server.ts`
- `ai-provider.server.ts`
- `ai.functions.ts`
- `stylist.functions.ts`
- `wearo-ai-chat.functions.ts`
- `wearo-ai-chat.ts`

### Admin, product, inventory and order
- `admin-dashboard.functions.ts`
- `admin-order.functions.ts` — compatibility re-export; implementation lives in `orders/`
- `admin-product-tags.ts`
- `admin-tags.ts`
- `product-admin.functions.ts`
- `orders/` — moved customer order and cancellation implementations
- `order.functions.ts`, `order-cancel.functions.ts` — compatibility re-exports

### Cart, customer and authentication
- `auth.ts`
- `cart.server.functions.ts`
- `cart.tsx`
- `customer-context.server.ts`
- `member.functions.ts`
- `mock-user.functions.ts`
- `mock-user.ts`

### Supabase and server infrastructure
- `supabase.server.ts`
- `supabase-user.server.ts`
- `supabase.user.server.ts`
- `server-reliability.ts`
- `feature-flags.server.ts`
- `rate-limit.server.ts`
- `request-security.server.ts`
- `security-headers.ts`

### Appearance, brand and design system
- `appearance/` — migrated implementation modules
- `appearance-branding.ts`, `appearance-content.ts`, `appearance-palettes.ts`, `appearance-theme-workflow.ts` — compatibility re-exports
- `brand.ts`
- `branding.ts`
- `design-system.ts`
- `theme.ts`
- `wearo-color-system.ts`

### Content, invoices and communication
- `invoice.client.ts`
- `invoice.functions.ts`
- `journal-markdown.tsx`
- `journal.functions.ts`
- `site-content.ts`

### Shared UI, analytics, errors and utilities
- `analytics.ts`
- `error-capture.ts`
- `error-page.ts`
- `i18n.tsx`
- `index.tsx`
- `lovable-error-reporting.ts`
- `seo.ts`
- `utils.ts`
- `vietqr.ts`
- `wishlist.ts`
- `product-reviews.ts`

## Important dependency and security findings

### Supabase modules are not confirmed duplicates

- `supabase-user.server.ts` exports `supabaseUserRequest(path, accessToken, options?)`.
- `supabase.user.server.ts` exports `supabaseUserRequest(accessToken, requestCallback)`, verifies the user through Auth, and provides a request client plus verified user ID.

Do not merge or rename these modules without tracing all call sites and reviewing authorization semantics. Keep privileged server code and secrets out of browser modules.

### Other similar names

- `wearo-ai-chat.ts` contains prompt configuration; `wearo-ai-chat.functions.ts` contains server logic.
- `admin-tags.ts` and `admin-product-tags.ts` serve different endpoints; the latter imports the `AdminTag` type from the former.
- The `.functions.ts` and `.server.ts` suffixes describe execution boundaries and should not be treated as evidence of duplication.

## Validation still required

This change was committed directly to `feature/product-admin`, but the repository has not been built or tested in a local branch checkout in this session. Do not treat the migration as verified until these pass:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run audit:architecture`
5. Relevant smoke/security tests and the resulting Vercel deployment

The original import paths are retained as shims specifically to reduce migration risk. Do not remove those shims until every consumer has been moved and the full checks pass.
