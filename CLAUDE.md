# Ledger App

A small ledger application with a Python API and a React frontend.

- @README.md covers setup, commands, Docker and the database
- Run `just` to list commands; if `just` is missing, read @justfile and run the commands directly
- Backend work: read @backend/CLAUDE.md
- Frontend work: read @frontend/CLAUDE.md

## Frontend

- TanStack Start (React 19) app under `frontend/`, with shadcn/ui, Tailwind and TanStack Form. Operate it with the `frontend-*` `just` recipes
- `backend/openapi.yaml` is the contract. The frontend uses a Massimo client generated from it under `src/generated-client/`. Never edit the generated client; run `just frontend-gen-api` after the spec changes
- Two boundaries, enforced by `just frontend-lint`:
  - Only `src/features/common/api/client.ts` imports the generated client. Everything else imports `{ api }` from there.
  - Only route loaders and server functions fetch. Components read data with `useLoaderData()`.

## Database

- PostgreSQL via Piccolo. The app applies migrations and seeds on startup; both are idempotent and there is no manual migrate or seed recipe
- Database code lives in `backend/app/db/`; repositories stay in their slices
- Postgres storage is tmpfs, so it is wiped on `down` and repopulated at startup
