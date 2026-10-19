# `src/lib` — Application Logic

This directory contains shared application logic used by routes and UI components. Keep one source of truth for each responsibility and keep server-only code separate from browser-safe helpers.

## Verified file map

The following files were checked on branch `feature/product-admin`. This is a focused inventory of the files inspected for the current cleanup, not a guarantee that it lists every file in this directory.

| File | Responsibility | Dependency / boundary notes |
|---|---|---|
| `ai.functions.ts` | AI try-on and concept-image server functions | Uses TanStack Start server functions, validation, customer context and feature flags. Keep provider secrets and server operations server-side. |
| `ai-provider.server.ts` | Image-provider selection and generation | Server-side provider abstraction; uses `server-reliability.ts`. |
| `stylist.functions.ts` | AI Stylist recommendations | Server functions; keep catalog data grounded in trusted application/database responses. |
| `wearo-ai-chat.functions.ts` | WEARO AI chat endpoint and response validation | Server functions; depends on customer context and AI SDK. |
| `supabase.server.ts` | Privileged server-side Supabase requests and product mapping | Reads server environment variables; never import into browser-facing modules. |
| `supabase-user.server.ts` | Supabase requests using a user's access token | Server-side authenticated requests; depends on `server-reliability.ts`. |
| `upthink-supabase.ts` | Browser-safe Supabase configuration and helpers for catalog/auth/admin UI | Imports product-admin server functions; uses publishable client configuration, not a service-role secret. |
| `product-admin.functions.ts` | Product and inventory administration server functions | Depends on `supabase.server.ts`; privileged writes must remain server-side and respect authorization/RLS. |
| `order.functions.ts` | Order-related operations and types | Depends on server-side Supabase request helpers and reliability utilities. |
| `server-reliability.ts` | Shared request IDs, timeout/retry and server logging helpers | Cross-cutting server utility; avoid creating competing implementations in feature folders. |
| `feature-flags.server.ts` | Server-side Vercel feature-flag evaluation | Fails closed when the flag configuration is absent. |

## Current grouping recommendation

Do **not** move files just because several filenames end in `.functions.ts` or `.server.ts`. Those suffixes communicate execution boundaries, not necessarily duplicate responsibilities.

Potential grouping to consider after the full import graph is checked:

- `ai/`: AI provider, try-on, stylist and chat modules.
- `orders/`: order functions and order-specific helpers, only if the wider import graph shows a coherent boundary.
- `supabase/`: shared Supabase transport/client helpers, only if moving them does not blur the server/client boundary.
- Keep cross-cutting utilities such as `server-reliability.ts` at the shared `lib` level unless a broader architecture review supports moving them.

These are **proposals, not current paths**. No files have been moved as part of this audit.

## Rules before moving a file

1. Search all imports and dynamic references to the exact path.
2. Check whether the module imports `.server.ts` code or privileged environment variables.
3. Move one cohesive group at a time and update every import in the same commit.
4. Run `npm run lint`, `npm run typecheck`, `npm run build`, and the relevant smoke/security tests.
5. Verify the resulting Vercel deployment; a successful GitHub commit alone is not a deployment check.

## Maintenance rule

Add a subfolder README only when the folder has meaningful architecture, security, or usage rules that are not obvious from its filenames. Do not create README files merely to fill every directory.
