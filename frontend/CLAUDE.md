# Ledger frontend

React app for the ledger, built with TanStack Start. It talks to the backend
through a client generated from `backend/openapi.yaml`, which is the contract.

## Tech stack

- TanStack Start (React 19): SSR and file-based routing on Vite
- TanStack Router and TanStack Form
- [Massimo](https://github.com/platformatic/massimo): generated API client
- shadcn/ui and Tailwind CSS
- Vitest and Testing Library
- ESLint (flat config) and Prettier

## Running

- Use the root `just` recipes (`frontend-dev`, `frontend-test`,
  `frontend-quality`, `frontend-gen-api`); run `just` for the full list. See
  @../README.md
- `frontend-dev` serves on `:3000` and needs the backend on `:8000`. Local dev:
  `just db-up`, `just backend-dev`, then `just frontend-dev`
- `@/` aliases `src/`

## Structure

Vertical slices under `src/features/<slice>/`, mirroring the backend. Routes
live in `src/routes/`; the API client lives in `features/common/`.

```
src/
  routes/                       # loaders call server functions
    __root.tsx
    _ledger.tsx                 # pathless layout; its loader reads the list
    _ledger/
      index.tsx                 # "/"
  features/
    common/api/client.ts        # builds the Massimo client once; exports `api`
    transactions/
      types.ts                  # types mirroring the OpenAPI schemas
      server/*.functions.ts     # server functions, the only callers of `api`
      components/               # read data via useLoaderData()
    shell/components/           # app chrome (AppShell)
    ui/                         # shadcn/ui components, hooks, lib
  generated-client/            # Massimo output, never edit by hand
  routeTree.gen.ts             # TanStack Router output, regenerated on dev/build
```

## Data flow

One direction: **route loader → server function → `api` → backend**. Components
never fetch.

- **Reads:** a route `loader` calls a `*Fn` server function in
  `features/<slice>/server/*.functions.ts`, which calls `api.*`. Loaders are
  exported separately from the route so tests can stub the server function.
  Components read the result with `useLoaderData()`.
- **Writes:** a server function (`createServerFn`) calls `api.*`, then the
  caller runs `router.invalidate()`. Gate success on the exact status code: the
  generated client returns non-2xx responses as-is instead of throwing (see
  `createTransaction.functions.ts`).
- Server functions run only on the server, so `api` never runs in the browser,
  even when a loader re-runs client-side. The backend URL stays server-side and
  the browser makes no cross-origin calls.

## Code style: the enforced boundaries

ESLint enforces the boundaries. A violation fails `just frontend-lint` with a
message naming the rule and the fix. When a lint or test fails with a reason,
fix using that reason.

<!-- Force an error by modifying the rule below -->

1. **The generated client is off-limits.** Only
   `src/features/common/api/client.ts` may import from `src/generated-client/**`.
   Everywhere else imports `{ api }` from that module.
2. **Only loaders and server functions fetch.** Components in `routes/` and
   `features/*` read data with `useLoaderData()` and never call `api` or
   `fetch`.

## The generated client

- `just frontend-gen-api` generates `src/generated-client/` from
  `backend/openapi.yaml` with Massimo in `--frontend` mode. Never hand-edit it.
- After changing the backend contract, regenerate the client and commit it.
- `client.ts` builds the client once at module load and picks the backend URL
  per runtime: `VITE_API_BASE_URL` in the browser, `API_SERVER_BASE_URL` in
  SSR. See `.env.example`.

## Testing

- `just frontend-lint` runs ESLint; the lint rules are tests
- `just frontend-typecheck` runs `tsc --noEmit`, also part of
  `just frontend-quality`. It needs `src/routeTree.gen.ts`, regenerated on every
  `dev` and `build` and committed so the check works on a fresh clone. Never
  edit it by hand
- `just frontend-test` runs Vitest and Testing Library. Tests are colocated as
  `*.test.tsx`
- Loaders are exported from their route modules so tests can stub the server
  function without booting the router
