# `src/lib` — Application Logic

This directory contains shared application logic used by routes and UI components. Keep one source of truth for each responsibility and keep server-only code separate from browser-safe helpers.

## Inventory checked on `feature/product-admin`

The directory contains **56 entries including this README** (55 TypeScript/TSX source files and this documentation file). The list below is a directory inventory by filename. Responsibilities are inferred from names and from the contents of the files inspected; filenames alone are not proof that two modules are interchangeable.

### AI and try-on
- `ai-jobs.server.ts`
- `ai-provider.server.ts`
- `ai.functions.ts`
- `stylist.functions.ts`
- `wearo-ai-chat.functions.ts`
- `wearo-ai-chat.ts`

### Admin, product, inventory and order
- `admin-dashboard.functions.ts`
- `admin-order.functions.ts`
- `admin-product-tags.ts`
- `admin-tags.ts`
- `product-admin.functions.ts`
- `order.functions.ts`
- `order-cancel.functions.ts`

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
- `appearance-branding.ts`
- `appearance-content.ts`
- `appearance-palettes.ts`
- `appearance-theme-workflow.ts`
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
- `wearo-ai-chat.ts`

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

## Findings and refactor decision

### 1. Do not merge similarly named Supabase modules yet

Both `supabase-user.server.ts` and `supabase.user.server.ts` exist. The inspected contents show that they expose different APIs:

- `supabase-user.server.ts` exports `supabaseUserRequest(path, accessToken, options?)` and performs a REST request using the provided access token.
- `supabase.user.server.ts` exports `supabaseUserRequest(accessToken, requestCallback)`, verifies the user through Auth, then supplies a request client and verified user ID to the callback.

They are **not drop-in duplicates**. Do not delete, rename, or consolidate either one until every import and call site has been traced and their security/authorization semantics have been reviewed.

### 2. Similar suffixes are not sufficient reason to move files

- `.functions.ts` is used for server-function modules, but the modules represent different domains and may be imported directly by routes/components.
- `.server.ts` marks server-oriented modules; do not move code in a way that weakens the server/client boundary.
- `wearo-ai-chat.ts` is a tiny prompt constant while `wearo-ai-chat.functions.ts` contains server logic. Their similar names do not mean they should be combined automatically.
- `admin-tags.ts` and `admin-product-tags.ts` serve different endpoints; the latter imports the `AdminTag` type from the former.

### 3. Proposed target organization — not applied

A future structure could group modules by domain:

- `ai/`: try-on, provider, jobs, stylist and chat modules.
- `orders/`: order, cancellation and admin order modules.
- `appearance/`: appearance branding, content, palettes and theme workflow.
- `supabase/`: only after a verified import graph and server/client boundary review.

This is a proposal only. Moving files requires updating every static and dynamic import, aliases, tests, architecture checks and any path-based tooling in the same change. The available code-search results did not provide a complete, branch-specific import graph, so they are not sufficient evidence to perform a safe bulk move.

## Safe next step

1. Use a branch-local checkout or a complete branch-specific Git tree/code search to map every import and dynamic import of each candidate file.
2. Review `scripts/audit-architecture.mjs` and tests for assumptions about current paths.
3. Choose one cohesive, low-risk domain and move it atomically with all import updates.
4. Run `npm run lint`, `npm run typecheck`, `npm run build`, and relevant smoke/security tests.
5. Verify the new commit's CI and Vercel deployment before declaring success.

## Maintenance rule

Add a subfolder README only when the folder has meaningful architecture, security, or usage rules that are not obvious from its filenames. Do not create README files merely to fill every directory.
