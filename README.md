# Ledger App

A small ledger application with a Python API and a React frontend. Coding
standards are enforced by linter rules and architecture tests rather than by
instructions alone, and CI runs the same checks as the local recipes.

## Layout

| Path                       | What it is                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`                 | Python API (Litestar, Piccolo, Postgres). See [backend/README.md](./backend/README.md).                                                     |
| `frontend/`                | React app (TanStack Start, shadcn/ui, Tailwind) using a client generated from the API spec. See [frontend/CLAUDE.md](./frontend/CLAUDE.md). |
| `justfile`                 | Every common command.                                                                                                                       |
| `.github/workflows/ci.yml` | CI pipeline, built on the same `just` recipes.                                                                                              |

## Prerequisites

- [`just`](https://github.com/casey/just)
- [`uv`](https://docs.astral.sh/uv/) for the backend
- [Node.js](https://nodejs.org/) 22+ and `npm` for the frontend
- [Docker](https://docs.docker.com/) with Compose for Postgres and the containerized run

## Quickstart

Run `just` to list all recipes.

### Backend

Start Postgres in Docker and run the API on the host with autoreload:

```sh
just backend-install
just db-up
just backend-dev
```

The API listens on `:8000` with defaults that match the Postgres container, so
no configuration is needed. It applies migrations and seeds example data on
startup, both idempotently. Check it with:

```sh
curl localhost:8000/health
```

The response is `{"status":"ok"}`.

Quality and test recipes:

```sh
just backend-quality
just backend-architecture-test
just backend-test
```

`backend-quality` formats and lints with autofixes. `backend-architecture-test`
runs the AST checks and needs no database. `backend-test` runs the test suite
and needs Postgres up.

See [backend/README.md](./backend/README.md) for the schema, endpoints and
environment variables.

### Frontend

The frontend needs the backend on `:8000`. Run it with autoreload on `:3000`:

```sh
just frontend-install
just frontend-dev
```

Quality and test recipes:

```sh
just frontend-quality
just frontend-test
```

`frontend-quality` formats, lints with autofixes and typechecks.
`frontend-test` runs the Vitest suite.

The frontend talks to the backend through a
[Massimo](https://github.com/platformatic/massimo) client generated from
`backend/openapi.yaml`. Regenerate it with `just frontend-gen-api` after the
spec changes.

### Running in Docker

```sh
just up
just docker-down
```

`just up` builds the images and starts Postgres, the backend on `:8000` and the
frontend on `:3000` in dev mode, with the source bind-mounted and autoreload on.
`just docker-down` stops and removes the containers.

- The frontend container gets two backend URLs: `VITE_API_BASE_URL` for the
  browser bundle and `API_SERVER_BASE_URL` for SSR, since the browser and the
  server reach the backend through different hosts. See
  [frontend/.env.example](./frontend/.env.example).
- Postgres data lives in tmpfs and is wiped on every `down`. The startup
  migrate and seed bring it back.
- The backend image's `CMD` is the production run without autoreload. Run it
  locally with `just backend-prod`.

## CI

The workflow in `.github/workflows/ci.yml` runs on pushes to `main` and on pull
requests. The backend job runs format, lint and architecture checks, then the
test suite against a Postgres service. The frontend job runs format, lint and
typecheck, then the test suite. Both jobs call the same `just` recipes used
locally.

## Documentation map

- [`CLAUDE.md`](./CLAUDE.md) for AI agents working in this repo
- [`backend/README.md`](./backend/README.md) backend operating guide
- [`backend/CLAUDE.md`](./backend/CLAUDE.md) backend conventions for agents
- [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) frontend conventions for agents

## License

[MIT](./LICENSE)
