# Supabase Database Reconciliation

> Updated 2026-10-21 from a read-only inspection of Supabase project `oazipcrbutizdncctkcg` and branch `feature/product-admin`.
> This file is a navigation summary, not executable SQL.

The current migration comparison is documented in [`reconciliation/2026-10-live-audit.md`](reconciliation/2026-10-live-audit.md). The exact live migration version/name ledger is in [`reconciliation/production-migration-manifest.json`](reconciliation/production-migration-manifest.json).

## Current verified state

- Live Supabase has 78 applied migration records.
- The application migration folder contains 39 SQL files.
- Only 6 files match both the exact live migration version and name; 22 share a live migration name but use a different timestamp; 11 have no exact version/name match.
- 72 live migration versions have no exact-version SQL file in the application migration folder.
- The live public schema has 28 tables, all with RLS enabled.
- Schema snapshots are reference-only and are not a substitute for original applied migration bodies.

## Safety rule

Do not rename historical migration files to force a match, reset production, disable RLS, or execute reconstructed SQL against production merely to make the ledger look synchronized. Recover the original SQL bodies, compare them with the live catalog, replay in a disposable database, and verify before production changes.

See `reconciliation/core_commerce_schema.md` and `reconciliation/live_payment_functions.sql` for the existing detailed reference material; these should also be checked against the current audit before reuse.
