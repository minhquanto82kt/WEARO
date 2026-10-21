# Supabase migrations — application root

This is the application's migration directory (`fashion-dream-try-on-main/supabase/migrations/`). Do not confuse it with the repository-level documentation directory at `/supabase/migrations/`.

## Reconciliation status (2026-10-21)

- Live Supabase migration ledger: 78 applied entries.
- SQL files here: 39.
- Exact live version + name matches: 6.
- Same migration name under a different timestamp: 22; equivalence is not verified.
- No exact version/name match: 11.
- Live ledger versions without an exact-version SQL file here: 72.

These 39 SQL files are a partial history, not a replayable baseline. Do not rename timestamps or apply the folder wholesale to production. The same-name files may not have the exact applied SQL body.

See [`../reconciliation/2026-10-live-audit.md`](../reconciliation/2026-10-live-audit.md) and [`../reconciliation/production-migration-manifest.json`](../reconciliation/production-migration-manifest.json).

## Before adding a new migration

1. Inspect the live table/column/constraint, RLS, grants, function, trigger, and Storage dependencies.
2. Confirm whether a migration with the same intent has already run in production under another version.
3. Use a new timestamp only for a genuinely new change; never rewrite historical versions.
4. Test on a disposable Supabase database before production.
5. Verify the applied migration, database behavior, and application flow after deployment.
