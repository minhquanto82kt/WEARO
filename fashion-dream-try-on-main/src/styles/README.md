# WEARO styles architecture

## Ownership boundaries

- `components/_header.scss`: single import boundary for the header cascade. The React component's interactive behavior remains in `src/components/site-nav.tsx`; its responsive and visual rules live in `src/styles/header-enhancements.scss`.
- `components/_footer.scss`: import boundary for the footer visual system in `src/styles/wearo-footer-unified.scss`. Footer markup stays in `src/components/site-footer.tsx`.
- `palette.scss` (in `src/`): source of truth for WEARO palette tokens. Component styles should consume `--wearo-blue`, `--wearo-blue-light`, `--wearo-peach`, `--wearo-beige`, and `--wearo-coral` rather than introducing unrelated brand colors.
- `ux-foundation.scss` (in `src/`): shared typography, touch-target, focus and reduced-motion guardrails.
- `styles.scss` (in `src/`): global import manifest. Import order is behavior: later compatibility layers can override earlier declarations.

## Rules for future UI work

1. Keep React behavior and styles separate; do not create a second header/footer implementation.
2. Scope selectors to a component/page root where possible. Avoid new broad `!important` overrides unless resolving a documented cascade conflict.
3. Keep responsive rules next to the component styles they govern.
4. Use design tokens for colors and shared spacing/type values. Do not hard-code a new palette inside a component.
5. Preserve import order unless the resulting CSS cascade has been checked.
6. Before moving a stylesheet, search all imports in both `src/styles.scss` and component files; update every reference in the same change.
7. Keep legacy compatibility styles until visual and build checks prove they can be removed. Similar filenames are not proof that two stylesheets are redundant.

## Current refactor boundary

The stylesheet directory contains accumulated feature, compatibility and polish layers. This pass introduces explicit header/footer component entry points and documents ownership without bulk-moving legacy files. A bulk move is intentionally avoided until duplicate selectors and import dependencies have been mapped; changing paths and cascade order at once would risk regressions across the storefront and admin pages.

## Suggested next migration order

1. Header/footer component rules.
2. Storefront home, shop, product and journal page rules.
3. Cart, checkout and account rules.
4. AI studio/workspace rules.
5. Admin rules.
6. Shared foundations and final compatibility layers.

For each migration, move one group, update all imports, compare before/after styles, run the production build, and verify the preview deployment before continuing.
