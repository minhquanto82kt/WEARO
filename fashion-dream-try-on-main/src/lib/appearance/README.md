# Appearance modules

This folder owns browser-facing appearance configuration and admin workflows backed by Supabase REST endpoints.

## Modules

- `appearance-branding.ts`: load and save global brand metadata.
- `appearance-content.ts`: load/save homepage and announcement content; upload branding assets.
- `appearance-palettes.ts`: list, create, update, archive, and delete palette records.
- `appearance-theme-workflow.ts`: draft, update, delete, and publish appearance themes.

## Boundaries

- These modules use Vite `import.meta.env.VITE_SUPABASE_*` publishable configuration and browser `sessionStorage`; they are browser-oriented and should not be imported into server-only modules as server utilities.
- They call Supabase REST/Storage directly with the current admin access token. Keep database RLS and storage policies enabled; UI-side token checks are not a replacement for authorization policies.
- Shared theme types and validation remain in `@/lib/theme`. `theme.ts` stays at the `src/lib` root because it imports global style sheets and branding side effects.
- Root-level files with the same names are compatibility re-exports. Keep them until consumers and architecture checks have been migrated and verified.

## Validation

Run lint, typecheck, build, architecture audit, and appearance/admin smoke checks before removing compatibility re-exports.
