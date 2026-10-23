# Component styles

This folder contains styles owned by shared UI components. Keep component markup/behavior in `src/components/` and styles here.

## Canonical files

| File | Responsibility | Status |
|---|---|---|
| `_header.scss` | Header/navigation visual system | Canonical import entry; imported from `src/styles.scss` as `./styles/components/header` |
| `_footer.scss` | Newsletter, footer columns, payment methods and sub-footer | Canonical import entry; imported from `src/styles.scss` as `./styles/components/footer` |

## Compatibility / audit files

| File | Notes |
|---|---|
| `header-enhancements.scss` | Retained pending an import-usage audit. Do not add new rules here until confirming it is part of the active cascade; it contains older styling that may conflict with the WEARO palette. |

## Rules

1. Prefer the canonical entry file for new component styles.
2. Do not create additional `*-final`, `*-production`, or hotfix files for a component without a documented reason.
3. Preserve the current import order in `src/styles.scss`; Sass cascade order affects the rendered site.
4. Before deleting or merging a file, search all imports/references and compare compiled output.
5. Keep selectors scoped to the component and use the WEARO palette tokens where available.
6. Verify desktop/mobile and run the production build after structural CSS changes.

## Recent cleanup

Footer rules previously lived in `footer-unified.scss` and were imported by `_footer.scss`. They have now been consolidated into `_footer.scss` so there is one source of truth for footer styles. The duplicate file was removed while preserving the global import path.
