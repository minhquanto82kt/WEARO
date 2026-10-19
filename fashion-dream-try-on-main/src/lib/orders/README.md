# Order modules

This folder contains customer and admin order server functions.

## Modules

- `order.functions.ts`: customer order creation, order history and order detail.
- `order-cancel.functions.ts`: customer order cancellation.
- `admin-order.functions.ts`: admin order listing, detail and status updates.

## Boundaries

- These files use TanStack Start `createServerFn`; keep authorization checks and server execution boundaries intact.
- Their Supabase and reliability imports intentionally point to shared modules one directory above. Do not copy Supabase helpers into this folder or expose privileged server code to browser modules.
- Root-level files with the same names are compatibility re-exports. Keep them until all consumers, architecture checks and generated server-function handling are verified.

## Validation

Run lint, typecheck, build, architecture audit, and customer/admin order smoke tests before removing compatibility re-exports.
