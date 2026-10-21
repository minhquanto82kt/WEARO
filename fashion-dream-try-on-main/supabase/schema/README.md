# Schema references

These files are reference artifacts, not the production migration chain.

- `010_member_loyalty_vouchers.sql` documents voucher tables and also contains seed/upsert statements. Do not execute it as a routine schema-sync script against production.
- `011_extended_live_tables.sql` is a generated catalog reference from 2026-10-21. It covers the 17 tables missing from the earlier core snapshots, including `vouchers` and `user_vouchers` for a self-contained catalog reference; those two tables are also documented in `010_member_loyalty_vouchers.sql`.

Both files are reference-only. `CREATE TABLE IF NOT EXISTS` does not reconcile columns, constraints, indexes, policies, grants, or function bodies on tables that already exist.

The actual migration folder is `../migrations/`. Its reconciliation status is documented in `../reconciliation/2026-10-live-audit.md`. Do not rename historical migration versions or apply reconstructed snapshots to production.
