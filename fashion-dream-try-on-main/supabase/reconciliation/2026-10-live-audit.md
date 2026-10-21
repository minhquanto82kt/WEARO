# WEARO Supabase Migration Reconciliation — 2026-10-21

Project: `oazipcrbutizdncctkcg`
Git branch: `feature/product-admin`
Application root: `fashion-dream-try-on-main/`

## Result at a glance

- Live Supabase migration ledger: **78 applied migrations**, from `20260909011420` through `20261020085351`.
- Actual application migration folder: `fashion-dream-try-on-main/supabase/migrations/` with **39 SQL files**.
- Exact version + name matches between the folder and live ledger: **6**.
- Same migration name but different version: **22**. These are not treated as equivalent until their SQL bodies are compared with the applied source.
- Files with neither an exact version nor exact migration name match: **11**.
- Live ledger versions without an exact-version SQL file in the application folder: **72 of 78**.
- A JSON manifest of the exact live version/name ledger is stored alongside this report.

## Why the migration folder must not be normalized by renaming files

The folder contains real SQL bodies, but many filenames use timestamps that do not exist in the live ledger. Some have a migration name matching a live entry under another timestamp; others do not match a live name at all. Renaming these files to live versions without verifying the body could make Supabase CLI replay a duplicate or different operation.

Do not apply all 39 files to production and do not fabricate the missing history from the schema snapshots. The available Supabase connector exposes the ledger versions/names and live catalog, but not all historical applied SQL bodies.

## Per-file comparison

| File in application folder | Status against live ledger | Live version/name when a name match exists |
|---|---|---|
| `20260911152000_create_try_on_jobs.sql` | Same name, different version; body not verified | `20260911150224` / `create_try_on_jobs` |
| `20260911210000_create_private_try_on_storage.sql` | Same name, different version; body not verified | `20260911150115` / `create_private_try_on_storage` |
| `20260911232000_create_product_vision_attributes.sql` | Same name, different version; body not verified | `20260911151500` / `create_product_vision_attributes` |
| `20260913110000_restore_authenticated_is_admin_execute.sql` | No exact version/name match | — |
| `20260914150000_orders_user_id_and_customer_history.sql` | Same name, different version; body not verified | `20260918111218` / `orders_user_id_and_customer_history` |
| `20260916041254_create_wishlist_items.sql` | Exact version + name match | `20260916041254` / `create_wishlist_items` |
| `20260917015004_create_appearance_palettes.sql` | Exact version + name match | `20260917015004` / `create_appearance_palettes` |
| `20260917025358_add_appearance_palette_status.sql` | Exact version + name match | `20260917025358` / `add_appearance_palette_status` |
| `20260917061805_create_appearance_theme_workflow.sql` | Exact version + name match | `20260917061805` / `create_appearance_theme_workflow` |
| `20260917061818_fix_appearance_theme_publish_constraint.sql` | Exact version + name match | `20260917061818` / `fix_appearance_theme_publish_constraint` |
| `20260917062756_harden_appearance_theme_workflow.sql` | Exact version + name match | `20260917062756` / `harden_appearance_theme_workflow` |
| `20260917083000_theme_library_history.sql` | No exact version/name match | — |
| `20260917090000_create_appearance_branding.sql` | Same name, different version; body not verified | `20260917080640` / `create_appearance_branding` |
| `20260917090000_extend_appearance_branding_content.sql` | No exact version/name match | — |
| `20260917100000_create_site_content_settings.sql` | Same name, different version; body not verified | `20260917071516` / `create_site_content_settings` |
| `20260917103000_add_content_draft_published_workflow.sql` | Same name, different version; body not verified | `20260917072048` / `add_content_draft_published_workflow` |
| `20260918190000_harden_data_access_and_customer_rls.sql` | Same name, different version; body not verified | `20260918111239` / `harden_data_access_and_customer_rls` |
| `20260918191000_consolidate_order_read_policies.sql` | Same name, different version; body not verified | `20260918111321` / `consolidate_order_read_policies` |
| `20260918191100_consolidate_order_item_read_policy.sql` | Same name, different version; body not verified | `20260918111327` / `consolidate_order_item_read_policy` |
| `20260919030000_phase_b_c_commerce_hardening.sql` | Same name, different version; body not verified | `20260918203154` / `phase_b_c_commerce_hardening` |
| `20260919031000_phase_c_fulfillment_hardening.sql` | Same name, different version; body not verified | `20260918203502` / `phase_c_fulfillment_hardening` |
| `20260919032000_phase_c_customer_cancel_order.sql` | Same name, different version; body not verified | `20260918204600` / `phase_c_customer_cancel_order` |
| `20260919032500_phase_b_rbac_completion.sql` | Same name, different version; body not verified | `20260918205223` / `phase_b_rbac_completion` |
| `20260919033000_phase_b_c_rpc_execute_hardening.sql` | Same name, different version; body not verified | `20260918204817` / `phase_b_c_rpc_execute_hardening` |
| `20260919033500_phase_b_c_security_and_commerce_final.sql` | Same name, different version; body not verified | `20260918205205` / `phase_b_c_security_and_commerce_final` |
| `20260919034000_phase_d_ai_jobs_and_storage.sql` | Same name, different version; body not verified | `20260918205835` / `phase_d_ai_jobs_and_storage` |
| `20260919034500_phase_f_security_hardening.sql` | No exact version/name match | — |
| `20260919035000_phase_e_catalog_performance.sql` | Same name, different version; body not verified | `20260918205931` / `phase_e_catalog_performance` |
| `20260919035000_phase_f_rls_policy_optimization.sql` | No exact version/name match | — |
| `20260919036000_phase_d_try_on_client_write_lockdown.sql` | Same name, different version; body not verified | `20260918210150` / `phase_d_try_on_client_write_lockdown` |
| `20260920050000_grant_authenticated_is_admin_execute.sql` | Same name, different version; body not verified | `20260919221248` / `grant_authenticated_is_admin_execute` |
| `20260923135000_product_reviews.sql` | No exact version/name match | — |
| `20260928100000_add_try_on_queue_indexes.sql` | No exact version/name match | — |
| `20261005065000_create_journal_articles.sql` | No exact version/name match | — |
| `20261018080000_public_style_tag_feed_and_casual_seed.sql` | Same name, different version; body not verified | `20261018021805` / `public_style_tag_feed_and_casual_seed` |
| `20261018093000_add_product_new_arrival_flag.sql` | No exact version/name match | — |
| `20261018094500_add_product_fashion_style.sql` | No exact version/name match | — |
| `20261018100000_align_product_fashion_style_with_collections.sql` | No exact version/name match | — |
| `20261020100000_enforce_minimum_product_price_1000.sql` | Same name, different version; body not verified | `20261020064041` / `enforce_minimum_product_price_1000` |

## Current live schema checks

- 28 public base tables were observed; all 28 have RLS enabled.
- `products` has `new_arrival`, `fashion_style`, and the `price >= 1000` constraint.
- Current order/payment method constraints allow `cod`, `vietqr`, and `momo`.
- `orders` includes `user_id`, `idempotency_key`, `voucher_id`, `voucher_code`, and `discount_amount`.
- Product visibility for public catalog reads requires `active = true` and `status = 'published'`.
- Storage buckets observed: `ai-results` (private), `email-assets` (public), `product-images` (public), `site-branding` (public), and `try-on-assets` (private).

## Security finding requiring follow-up

Supabase's security advisor reports exposed SECURITY DEFINER functions. Direct inspection confirmed `apply_best_member_voucher(p_order_id uuid, p_user_id uuid)` is executable by `anon` and `authenticated`; it updates order/payment/voucher state but does not compare `p_user_id` with `auth.uid()`. This is a potential authorization gap if a caller can obtain another user's order and user IDs. `get_public_product_style_tags()` is also executable by both roles; its public-read behavior may be intentional but the SECURITY DEFINER/grants need justification.

No function grants or definitions were changed. Review app/server call sites and test owner, cross-user, and anonymous calls in non-production before preparing a hardening migration.

## Next steps

1. Retrieve the exact applied SQL bodies from the original migration source, Supabase CLI history, or a trusted backup.
2. For each of the 39 existing files, compare its SQL body with the matching live migration; do not infer equivalence from names.
3. Recover missing exact-version bodies and preserve their original timestamps/names.
4. Replay the verified migration history on a disposable Supabase database.
5. Compare schema, constraints, indexes, RLS, grants, functions, triggers, and Storage policies with production.
6. Only after parity and tests pass, use the folder for future migrations.

## Production safety

This reconciliation used read-only catalog queries. No production DDL, data writes, or migrations were executed.
