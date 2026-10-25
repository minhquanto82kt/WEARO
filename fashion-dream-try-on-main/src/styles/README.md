# WEARO styles architecture

## Ownership boundaries

- `components/_header.scss`: canonical header stylesheet entry point. Header behavior stays in `src/components/site-nav.tsx`. The separate `components/header-enhancements.scss` is retained as a legacy/supplemental file until its import usage and visual effect are verified.
- `components/_footer.scss`: canonical footer stylesheet for newsletter, footer columns, payment logos and sub-footer. Footer markup stays in `src/components/site-footer.tsx`.
- `palette.scss` (in `src/`): source of truth for WEARO palette tokens.
- `ux-foundation.scss` (in `src/`): shared typography, touch-target, focus and reduced-motion guardrails.
- `styles.scss` (in `src/`): global import manifest. Import order is behavior: later compatibility layers can override earlier declarations.

## Rules for future UI work

1. Keep React behavior and styles separate; do not create a second header/footer implementation.
2. Treat `styles/components/README.md` as the directory map. Keep `_header.scss` and `_footer.scss` as the component entry files.
3. Keep new header rules in `components/_header.scss`; do not add another final/production/hotfix stylesheet for the same selectors.
4. Scope selectors to a component/page root where possible. Avoid new broad `!important` overrides unless resolving a documented cascade conflict.
5. Keep responsive rules next to the component styles they govern.
6. Use design tokens for colors and shared spacing/type values. Avoid introducing unrelated brand colors.
7. Preserve import order unless the resulting CSS cascade has been checked.
8. Before moving a stylesheet, search all imports in `src/styles.scss` and component files; update every reference in the same change.
9. Keep legacy compatibility styles only until build and visual checks prove they can be removed. Similar filenames are not proof that two stylesheets are redundant.

## Current refactor boundary

Footer rules have been consolidated into `components/_footer.scss`; the duplicate `footer-unified.scss` file was removed. The existing global import remains `@import "./styles/components/footer"`, which resolves to the canonical `_footer.scss`. Footer declarations and global import order are preserved.

The header entry point remains `components/_header.scss`. `header-enhancements.scss` is retained for now rather than deleted or merged blindly: its selectors include older visual rules, so it must be proven unused or reconciled with the canonical file before removal.

Other page/style groups remain in place until dependencies and cascade effects can be mapped safely.

## Suggested next migration order

1. Audit header and footer component rules.
2. Group storefront home, shop, product and journal rules.
3. Group cart, checkout and account rules.
4. Group AI studio/workspace rules.
5. Group admin rules.
6. Audit shared foundations and final compatibility layers.

For each migration, move one group, update all imports, compare before/after styles, run the production build, and verify the preview deployment before continuing.

## Current stylesheet organization (2026-10)

The following files were moved without changing their CSS declarations or their relative position in the global import cascade:

- `foundations/global-ui.scss` — shared WEARO UI aliases, surfaces, form controls and interaction styling (formerly `wearo-ui-v2.scss`).
- `foundations/ui-convergence.scss` — late-loaded global visual convergence rules for storefront, shop, cart and checkout (formerly `wearo-ui-v2-final.scss`).
- `pages/home-ai-refinements.scss` — homepage hero and AI workspace refinements (formerly `wearo-p0-ux-refinement.scss`).
- `foundations/account-and-accessibility.scss` — account visual overrides plus shared focus/reduced-motion rules (formerly `wearo-p3-final.scss`). This file is intentionally in foundations because its focus and reduced-motion selectors are global, not account-only.

The four imports were updated in `src/styles.scss` in the same commit and kept in their original order. No selectors were merged or deleted.

## Remaining inventory and migration policy

The styles directory currently contains dedicated groups for home, AI, admin, journal, commerce, collections, brand/theme, and shared components. Keep the current names for files whose scope is already descriptive (for example `wearo-collection-pages.scss`, `wearo-product-card.scss`, `wearo-shop-page.scss`, `wearo-cart-page.scss`, `wearo-checkout-page.scss`, `ai-studio.scss`, and `components/_header.scss` / `components/_footer.scss`). Do not batch-rename or move these until every direct import and the global `styles.scss` cascade has been checked.

A stylesheet is not safe to merge or delete merely because another file has a similar name. The next migration groups should be handled separately: (1) home/storefront, (2) shop/product/collections, (3) cart/checkout/account, (4) AI studio/workspace, (5) admin/journal, and (6) shared theme/accessibility. For each group, preserve import order, run the production build, then visually compare desktop and mobile before moving on.

