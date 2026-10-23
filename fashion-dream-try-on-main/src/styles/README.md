# WEARO styles architecture

## Ownership boundaries

- `components/_header.scss`: the sole canonical header stylesheet and import boundary. The former unified/final/production/menu override files have been consolidated here in their original cascade order. The React component's interactive behavior remains in `src/components/site-nav.tsx`; supplemental responsive rules remain in `src/styles/components/header-enhancements.scss`.
- `components/_footer.scss`: import boundary for the footer visual system in `src/styles/components/footer-unified.scss`. Footer markup stays in `src/components/site-footer.tsx`.
- `palette.scss` (in `src/`): source of truth for WEARO palette tokens. Component styles should consume `--wearo-blue`, `--wearo-blue-light`, `--wearo-peach`, `--wearo-beige`, and `--wearo-coral` rather than introducing unrelated brand colors.
- `ux-foundation.scss` (in `src/`): shared typography, touch-target, focus and reduced-motion guardrails.
- `styles.scss` (in `src/`): global import manifest. Import order is behavior: later compatibility layers can override earlier declarations.

## Rules for future UI work

1. Keep React behavior and styles separate; do not create a second header/footer implementation.
2. Keep all new header rules in `components/_header.scss`; do not add another `final`, `production`, or hotfix stylesheet for the same selectors.
3. Scope selectors to a component/page root where possible. Avoid new broad `!important` overrides unless resolving a documented cascade conflict.
4. Keep responsive rules next to the component styles they govern.
5. Use design tokens for colors and shared spacing/type values. Do not hard-code a new palette inside a component.
6. Preserve import order unless the resulting CSS cascade has been checked.
7. Before moving a stylesheet, search all imports in both `src/styles.scss` and component files; update every reference in the same change.
8. Keep legacy compatibility styles only until build and visual checks prove they can be removed. Similar filenames are not proof that two stylesheets are redundant.

## Current refactor boundary

The stylesheet directory still contains accumulated feature, compatibility and polish layers. Header and footer styles live under `styles/components/` with explicit entry points. The header cascade is now one file; its rules were concatenated in their former order without changing the compiled CSS. Other page/style groups remain in place until their dependencies and cascade effects can be mapped safely.

## Suggested next migration order

1. Header/footer component rules.
2. Storefront home, shop, product and journal page rules.
3. Cart, checkout and account rules.
4. AI studio/workspace rules.
5. Admin rules.
6. Shared foundations and final compatibility layers.

For each migration, move one group, update all imports, compare before/after styles, run the production build, and verify the preview deployment before continuing.
