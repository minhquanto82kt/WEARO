# Database checks

This directory contains read-only audit queries for the live or staging Supabase database.

## `001_security_integrity_audit.sql`

Checks all 28 currently observed public tables, RLS enablement, selected uniqueness/integrity constraints, the minimum product price and MoMo constraints, critical order/payment RPC presence, and a report of SECURITY DEFINER functions executable by anon/authenticated roles.

The audit is intentionally non-mutating. Run it from a privileged SQL editor/session and review the results together with the current `pg_policies` and `storage.objects` policies.

A `PASS` means the specific invariant checked by the query is present; it does not prove the complete database security model is correct.
