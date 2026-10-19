# `src/lib` — Application Logic

Shared application logic for routes and UI components. Keep one source of truth per responsibility, preserve server/client boundaries, and avoid moving modules until their callers and security semantics have been reviewed.

## Directory map

The tree below reflects the **current repository state** on `feature/product-admin`. It distinguishes implementation folders from root-level compatibility entry points so a reader can see what has actually been migrated.

```text
src/lib/
├── README.md
├── appearance/                         # Appearance implementation
│   ├── branding / content / palettes
│   └── theme workflow
├── orders/                              # Order implementation
│   ├── customer order functions
│   ├── cancellation functions
│   └── admin order functions
│
├── AI & virtual try-on
│   ├── ai-jobs.server.ts
│   ├── ai-provider.server.ts
│   ├── ai.functions.ts
│   ├── stylist.functions.ts
│   ├── wearo-ai-chat.functions.ts
│   └── wearo-ai-chat.ts
│
├── Admin, products & inventory
│   ├── admin-dashboard.functions.ts
│   ├── admin-product-tags.ts
│   ├── admin-tags.ts
│   └── product-admin.functions.ts
│
├── Cart, customers & authentication
│   ├── auth.ts
│   ├── cart.server.functions.ts
│   ├── cart.tsx
│   ├── customer-context.server.ts
│   ├── member.functions.ts
│   ├── mock-user.functions.ts
│   └── mock-user.ts
│
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
│
├── Appearance, brand & design system
│   ├── appearance-branding.ts             # Compatibility re-export
│   ├── appearance-content.ts              # Compatibility re-export
│   ├── appearance-palettes.ts             # Compatibility re-export
│   ├── appearance-theme-workflow.ts       # Compatibility re-export
│   ├── brand.ts
│   ├── branding.ts
│   ├── design-system.ts
│   ├── theme.ts                           # Shared theme entry point; stays at root
│   └── wearo-color-system.ts
│
├── Content, invoices & communication
│   ├── invoice.client.ts
│   ├── invoice.functions.ts
│   ├── journal-markdown.tsx
│   ├── journal.functions.ts
│   └── site-content.ts
│
└── Shared UI, analytics, errors & utilities
    ├── analytics.ts
    ├── error-capture.ts
    ├── error-page.ts
    ├── i18n.tsx
    ├── index.tsx
    ├── lovable-error-reporting.ts
    ├── product-reviews.ts
    ├── seo.ts
    ├── utils.ts
    ├── vietqr.ts
    └── wishlist.ts
```

> **Reading note:** The category labels in this diagram are visual groupings, not physical directories. The actual directories currently present are `appearance/` and `orders/`; other modules remain at the root until import paths and execution boundaries are verified.

## Current migration status

- `appearance/` contains the implementations for appearance branding, content, palettes, and theme workflow.
- `orders/` contains the migrated customer order, cancellation, and admin order implementations.
- Root-level `appearance-*.ts`, `admin-order.functions.ts`, `order.functions.ts`, and `order-cancel.functions.ts` paths are compatibility re-exports. Keep them until consumers have been migrated and checks pass.
- `theme.ts` stays at the root because it imports global style sheets and branding side effects and is used as a shared theme entry point.
- No Supabase modules have been moved or merged. `supabase-user.server.ts` and `supabase.user.server.ts` expose different APIs; review all callers and authorization semantics before changing either.
- AI server functions remain at the root until server-function boundaries and dynamic imports are reviewed.

## Module boundaries and cautions

### Supabase modules are not confirmed duplicates

- `supabase-user.server.ts` exports `supabaseUserRequest(path, accessToken, options?)`.
- `supabase.user.server.ts` exports `supabaseUserRequest(accessToken, requestCallback)`, verifies the user through Auth, and provides a request client plus verified user ID.

Do not merge or rename these modules without tracing call sites and reviewing authorization. Keep privileged server code and secrets out of browser modules.

### Other similar names

- `wearo-ai-chat.ts` contains prompt configuration; `wearo-ai-chat.functions.ts` contains server logic.
- `admin-tags.ts` and `admin-product-tags.ts` serve different endpoints; the latter imports the `AdminTag` type from the former.
- The `.functions.ts` and `.server.ts` suffixes describe execution boundaries and are not evidence of duplication.

## Validation required before further moves

The migration has not been verified by a local build in this session. Before moving more modules or removing compatibility re-exports, run:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run audit:architecture`
5. Relevant smoke/security tests and verify the resulting Vercel deployment.

GitHub commits alone do not prove that runtime imports, server/client boundaries, or production behavior remain correct.
