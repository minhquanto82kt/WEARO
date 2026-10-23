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
