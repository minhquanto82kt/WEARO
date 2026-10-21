# Production migrations

This directory tracks the path from the live Supabase migration history to a replayable Git-managed migration history.

## Current state

The live Supabase project reports **78 applied production migrations**. Their exact versions and names are captured in `production-manifest.json`.

The repository contains a partial set of 39 SQL files under `fashion-dream-try-on-main/supabase/migrations/`, but only 6 match the live ledger by exact version and name. Another 22 share a migration name under a different version, and 11 have no exact name/version match. The full set of 78 historical migration bodies is therefore **not yet represented as a verified replayable baseline**. See `fashion-dream-try-on-main/supabase/reconciliation/2026-10-live-audit.md`.

The repository's `supabase/schema/` files are reconstructed snapshots and must **not** be renamed, concatenated, or copied here as a fake baseline.

## Required baseline procedure

1. Retrieve/export the exact SQL body for each of the 78 production migrations.
2. Preserve the original migration version/timestamp and name.
3. Commit the files in exact version order.
4. Verify that all tables, columns, constraints, indexes, enums, RLS policies, grants, functions, triggers, storage buckets, and storage policies are represented.
5. Apply the complete history to a disposable/non-production Supabase database.
6. Run the repository read-only audit and compare the catalog/RLS/RPC/storage surface with production.
7. Only after parity is confirmed should this directory become the source for future database changes.

## Rules

- Never rewrite or renumber already-applied production migration IDs.
- Never silently convert a schema snapshot into a migration.
- Never apply a reconstructed baseline over the existing production database.
- Prefer small, ordered, backward-compatible changes after baseline parity is established.
- Every authorization migration requires an RLS/grant/security-definer review.
- Every entity migration requires a dependent application/API review.
- Every storage migration requires bucket and `storage.objects` policy review.
- Production deployment must be verified after migration, not inferred from GitHub commit success.
