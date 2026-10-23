# Backend preflight scripts

These scripts are preventive checks. They do not replace runtime tests, a security review, Supabase RLS verification, or provider sandbox transactions.

## Commands

Run from `fashion-dream-try-on-main/`:

- `npm run check:env` — validates CI/build-required variables and checks `.env.example` for secret-like variable names using the `VITE_` client prefix. It never prints values.
- `npm run check:env:preview` — checks the public Supabase variables required by a Preview build.
- `npm run check:env:production` — checks common production server variables and conditional provider configuration. Run this only in a trusted environment where production variables are available.
- `npm run audit:api-security` — scans source files for known server-secret identifiers outside server-only boundaries and emits manual-review warnings for sensitive API routes that lack recognizable security markers.

## Exit behavior

- Environment checker exits non-zero when a required variable is missing or a secret-like name is configured with a `VITE_` prefix. It does not reveal values.
- API audit exits non-zero only for known secret/private-key markers found outside server-only boundaries. Heuristic route warnings are informational to reduce false positives.

## Limitations

Static source scanning cannot prove authorization, RLS, webhook signature verification, replay protection, or correct payment state transitions. A route may be secure without matching the script's heuristic markers, and a marker alone is not proof of security. Review every warning manually and test the behavior.

CI runs the `ci` environment profile using placeholder public Supabase values and runs the API audit before build/test stages. No production credentials are required by these checks.
