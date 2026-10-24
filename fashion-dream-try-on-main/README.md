# WEARO — Fashion Commerce + AI Try-On

WEARO is a customer-facing **casual, modern and unisex** fashion commerce experience with AI-assisted styling and Virtual Try-On.

The repository also contains **UpThink**, the internal control layer used to operate how WEARO works: catalog, inventory, orders, appearance/content settings and AI configuration.

## Brand architecture

```text
UPTHINK
Internal control / admin
        ↓
WEARO
Customer-facing fashion brand
```

- Public storefront → **WEARO**
- `/admin` → **UpThink / WEARO Control System**
- Supabase → source of truth for production data
- GitHub → source of truth for application code
- Vercel → deployment/runtime

## Project status

| Area | Live status / source |
|---|---|
| CI on `feature/product-admin` | [![CI](https://github.com/minhquanto82kt/WEARO/actions/workflows/ci.yml/badge.svg?branch=feature/product-admin)](https://github.com/minhquanto82kt/WEARO/actions/workflows/ci.yml?query=branch%3Afeature%2Fproduct-admin) |
| GitHub Actions runs | [View branch workflow runs](https://github.com/minhquanto82kt/WEARO/actions?query=branch%3Afeature%2Fproduct-admin) |
| Vercel deployments | [Open deployment dashboard](https://vercel.com/up-think/fashion-dream-try-on-main) |
| Source branch | [`feature/product-admin`](https://github.com/minhquanto82kt/WEARO/tree/feature/product-admin) |

> **Status accuracy:** The CI badge reflects the GitHub Actions workflow run status for this branch; it does not certify production runtime health, Supabase connectivity, payment completion, or AI provider availability. Confirm those separately in the linked dashboards.

## Stack

- React 19 + TypeScript
- TanStack Start / Router
- Vite
- Supabase Auth + PostgreSQL + RLS
- AI SDK / server-side AI integrations
- Vercel deployment
- npm 11 / Node 24

## Development

```bash
npm install
npm run dev
```

Recommended verification before pushing:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:smoke
```

## Virtual Try-On provider

The Try-On server provider is selected with the server-only `AI_IMAGE_PROVIDER` variable:

- `openai` (default): uses the existing AI SDK / OpenAI Gateway integration.
- `replicate`: uses Replicate's HTTPS API and the `prunaai/p-image-try-on` model by default.

For Replicate, configure `REPLICATE_API_TOKEN` as a server-side Vercel Environment Variable. Optionally set `REPLICATE_TRYON_MODEL` to another compatible Replicate model in `owner/model` format. Keep the token out of source control and never prefix it with `VITE_`.

The Replicate provider is used by Virtual Try-On jobs; the separate AI Concept generation flow remains on its existing AI SDK model. The AI Studio consent notice discloses that uploaded images are processed by a third-party AI provider.

Run the provider configuration/invariant check with `npm run test:replicate-provider`. This check validates the integration wiring; a real end-to-end test still requires a valid Replicate token and successful provider response.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layers, ownership and data boundaries
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — development/change workflow
- [`docs/BRAND-SYSTEM.md`](docs/BRAND-SYSTEM.md) — WEARO/UpThink brand contract
- [`docs/ADMIN-AUTH-RUNBOOK.md`](docs/ADMIN-AUTH-RUNBOOK.md) — `/admin` auth/RLS troubleshooting
- [`docs/DEPLOYMENT-RUNBOOK.md`](docs/DEPLOYMENT-RUNBOOK.md) — Vercel release and production verification
- [`TYPOGRAPHY.md`](TYPOGRAPHY.md) — typography rules

## WEARO visual hierarchy

Primary: `#54728C`

Secondary: `#F2AD94`

Neutral: `#FFFFFF`

Supporting tones: `#7794A6`, `#F2CEAE`, `#D9BBA9`

## Engineering rules

1. Supabase is the production data source of truth.
2. Keep CRUD, authorization and RLS explicit.
3. Never expose service-role or provider secrets to the client.
4. Prefer minimal changes over rewrites.
5. Do not mark a feature complete based only on a GitHub commit; verify build/runtime behavior.
6. Keep UpThink and WEARO distinct: operator layer vs customer brand.
