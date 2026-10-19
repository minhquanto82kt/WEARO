# `src/lib` — Application Logic

Shared application logic for routes and UI components. Domain implementations are grouped into physical directories while root-level compatibility re-exports preserve existing import paths during migration.

## Directory map

The tree below reflects the current repository structure on `feature/product-admin`. Files marked as compatibility entry points stay at the root intentionally so existing callers do not need to change in this migration.

```text
src/lib/
├── README.md
├── ai/
│   └── wearo-ai-chat.ts                 # Prompt configuration only
├── analytics/
│   └── analytics.ts
├── appearance/
│   ├── README.md
│   ├── appearance-branding.ts
│   ├── appearance-content.ts
│   ├── appearance-palettes.ts
│   ├── appearance-theme-workflow.ts
│   └── brand.ts
├── orders/
│   ├── README.md
│   ├── admin-order.functions.ts
│   ├── order-cancel.functions.ts
│   └── order.functions.ts
├── payments/
│   └── vietqr.ts
├── seo/
│   └── seo.ts
├── shared/
│   └── utils.ts
│
├── AI/server functions (remain at root)
│   ├── ai-jobs.server.ts
│   ├── ai-provider.server.ts
│   ├── ai.functions.ts
│   ├── stylist.functions.ts
│   └── wearo-ai-chat.functions.ts
├── Admin & products
│   ├── admin-dashboard.functions.ts
│   ├── admin-product-tags.ts
│   ├── admin-tags.ts
│   └── product-admin.functions.ts
├── Cart, customers & authentication
│   ├── auth.ts
│   ├── cart.server.functions.ts
│   ├── cart.tsx
│   ├── customer-context.server.ts
│   ├── member.functions.ts
│   ├── mock-user.functions.ts
│   └── mock-user.ts
├── Supabase & server infrastructure
│   ├── supabase.server.ts
│   ├── supabase-user.server.ts
│   ├── supabase.user.server.ts
│   ├── upthink-supabase.ts
│   ├── server-reliability.ts
│   ├── feature-flags.server.ts
│   ├── rate-limit.server.ts
│   ├── request-security.server.ts
│   ├── security-headers.ts
│   └── momo.server.ts
├── Appearance & design system
│   ├── appearance-branding.ts             # Compatibility re-export
│   ├── appearance-content.ts              # Compatibility re-export
│   ├── appearance-palettes.ts             # Compatibility re-export
│   ├── appearance-theme-workflow.ts       # Compatibility re-export
│   ├── brand.ts                            # Compatibility re-export
│   ├── branding.ts
│   ├── design-system.ts
│   ├── theme.ts                            # Shared entry point; stays at root
│   └── wearo-color-system.ts
├── Content, invoices & communication
│   ├── invoice.client.ts
│   ├── invoice.functions.ts
│   ├── journal-markdown.tsx
│   ├── journal.functions.ts
│   └── site-content.ts
└── Root compatibility entry points & remaining modules
    ├── admin-order.functions.ts
    ├── analytics.ts
    ├── order-cancel.functions.ts
    ├── order.functions.ts
    ├── seo.ts
    ├── utils.ts
    ├── vietqr.ts
    ├── wearo-ai-chat.ts
    ├── error-capture.ts
    ├── error-page.ts
    ├── i18n.tsx
    ├── index.tsx
    ├── lovable-error-reporting.ts
    ├── product-reviews.ts
    └── wishlist.ts
```

## Migration decisions

- `appearance/` contains appearance branding, content, palettes, theme workflow, and the shared brand constants.
- `orders/` contains customer order, cancellation, and admin order implementations.
- `analytics/`, `seo/`, `shared/`, and `payments/` group provider-neutral analytics, SEO helpers, class-name utilities, and VietQR URL construction.
- `ai/wearo-ai-chat.ts` contains prompt configuration only. AI server functions remain at the root to avoid changing server-function boundaries or dynamic-import behavior without full caller review.
- Root-level `analytics.ts`, `seo.ts`, `utils.ts`, `vietqr.ts`, `brand.ts`, and `wearo-ai-chat.ts` are compatibility re-exports. Keep them until imports are migrated and all checks pass.
- Root-level `appearance-*.ts`, `admin-order.functions.ts`, `order.functions.ts`, and `order-cancel.functions.ts` are also compatibility re-exports.
- `theme.ts` stays at the root because it imports global style sheets and branding side effects and is used as a shared theme entry point.
- No Supabase modules have been moved or merged. `supabase-user.server.ts` and `supabase.user.server.ts` expose different APIs; review all callers and authorization semantics before changing either.

## Module boundaries and cautions

### Supabase modules are not confirmed duplicates

- `supabase-user.server.ts` exports `supabaseUserRequest(path, accessToken, options?)`.
- `supabase.user.server.ts` exports `supabaseUserRequest(accessToken, requestCallback)`, verifies the user through Auth, and provides a request client plus verified user ID.

Do not merge or rename these modules without tracing call sites and reviewing authorization. Keep privileged server code and secrets out of browser modules.

### Similar names do not imply duplicate responsibilities

- `wearo-ai-chat.ts` contains prompt configuration; `wearo-ai-chat.functions.ts` contains server logic.
- `admin-tags.ts` and `admin-product-tags.ts` serve different endpoints; the latter imports the `AdminTag` type from the former.
- The `.functions.ts` and `.server.ts` suffixes describe execution boundaries and are not evidence of duplication.

## Validation status

The GitHub API can update repository contents, but this session cannot run the project commands in the repository's Node environment. After this commit, CI must verify:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run audit:architecture`
5. Relevant smoke/security tests and the resulting Vercel deployment.

A successful GitHub commit alone does not prove runtime imports or production behavior.
