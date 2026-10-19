# `src/lib` — Application Logic

Shared application logic for routes and UI components. Domain implementations are grouped into physical directories where this can be done safely. Root-level compatibility re-exports preserve existing import paths during migration.

## Directory tree

This is the physical directory structure on `feature/product-admin`. Files shown directly beneath `src/lib/` are root-level files, not implied subdirectories.

```text
src/lib/
├── ai/
│   └── wearo-ai-chat.ts
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
├── README.md
├── admin-dashboard.functions.ts
├── admin-order.functions.ts             # Compatibility re-export
├── admin-product-tags.ts
├── admin-tags.ts
├── ai-jobs.server.ts
├── ai-provider.server.ts
├── ai.functions.ts
├── analytics.ts                         # Compatibility re-export
├── appearance-branding.ts               # Compatibility re-export
├── appearance-content.ts                # Compatibility re-export
├── appearance-palettes.ts               # Compatibility re-export
├── appearance-theme-workflow.ts         # Compatibility re-export
├── auth.ts
├── brand.ts                             # Compatibility re-export
├── branding.ts
├── cart.server.functions.ts
├── cart.tsx
├── customer-context.server.ts
├── design-system.ts
├── error-capture.ts
├── error-page.ts
├── feature-flags.server.ts
├── i18n.tsx
├── index.tsx
├── invoice.client.ts
├── invoice.functions.ts
├── journal-markdown.tsx
├── journal.functions.ts
├── lovable-error-reporting.ts
├── member.functions.ts
├── mock-user.functions.ts
├── mock-user.ts
├── momo.server.ts
├── order-cancel.functions.ts            # Compatibility re-export
├── order.functions.ts                   # Compatibility re-export
├── product-admin.functions.ts
├── product-reviews.ts
├── rate-limit.server.ts
├── request-security.server.ts
├── security-headers.ts
├── seo.ts                               # Compatibility re-export
├── server-reliability.ts
├── site-content.ts
├── stylist.functions.ts
├── supabase-user.server.ts
├── supabase.server.ts
├── supabase.user.server.ts
├── theme.ts                             # Shared theme entry point; stays at root
├── upthink-supabase.ts
├── utils.ts                             # Compatibility re-export
├── vietqr.ts                            # Compatibility re-export
├── wearo-ai-chat.functions.ts
├── wearo-ai-chat.ts                     # Compatibility re-export
├── wearo-color-system.ts
└── wishlist.ts
```

## Migration decisions

- `appearance/` contains appearance branding, content, palettes, theme workflow, and shared brand constants.
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

The repository's CI workflow is triggered by the refactor commit. I cannot run commands inside the repository's Node environment from this session, so the following must be confirmed by CI before treating the migration as verified:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run audit:architecture`
5. Relevant smoke/security tests and the resulting Vercel deployment.

A successful GitHub commit alone does not prove runtime imports or production behavior.
