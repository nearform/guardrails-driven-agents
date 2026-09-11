# Ledger App

[![CI](https://github.com/nearform/guardrails-driven-agents/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nearform/guardrails-driven-agents/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A small ledger application with a Python API and a React frontend. Coding
standards are enforced by linter rules and architecture tests rather than by
instructions alone, and CI runs the same checks as the local recipes.

**Here for the guardrails?** Skip the setup and jump to
[Trying the guardrails](#trying-the-guardrails).

## Contents

- [Layout](#layout)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Running in Docker](#running-in-docker)
- [Trying the guardrails](#trying-the-guardrails)
  - [Python: architecture testing with `ast`](#python-architecture-testing-with-ast)
  - [TypeScript: embedding custom ESLint rules](#typescript-embedding-custom-eslint-rules)
  - [Where the rules live](#where-the-rules-live)
- [CI](#ci)
- [Documentation map](#documentation-map)
- [Disclaimer](#disclaimer)
- [License](#license)

## Layout

| Path                       | What it is                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`                 | Python API (Litestar, Piccolo, Postgres). See [backend/README.md](./backend/README.md).                                                     |
| `frontend/`                | React app (TanStack Start, shadcn/ui, Tailwind) using a client generated from the API spec. See [frontend/CLAUDE.md](./frontend/CLAUDE.md). |
| `justfile`                 | Every common command.                                                                                                                       |
| `.github/workflows/ci.yml` | CI pipeline, built on the same `just` recipes.                                                                                              |

## Prerequisites

- [Docker](https://docs.docker.com/) with Compose — required, for Postgres and the containerized run

To run the backend or frontend locally on the host (instead of in Docker):

- [`uv`](https://docs.astral.sh/uv/) for the backend
- [Node.js](https://nodejs.org/) 22+ and `npm` for the frontend

To use the `just` recipes shown throughout this README (optional — you can
always read [`justfile`](./justfile) and run the underlying commands
directly):

- [`just`](https://github.com/casey/just)

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

## Trying the guardrails

Lint rules and architecture tests act as deterministic guardrails for coding
agents, and they can express moderately complex rules and coding standards:
import boundaries, function signatures, where a decorator may appear, what may
be done with a value. To see them at work, open the repo in a coding agent that
reads `CLAUDE.md`, give it one of the tasks below and ask it to run the check
itself:

1. Ask for a change.
2. The agent edits, following whatever `CLAUDE.md` tells it.
3. It runs `just backend-architecture-test` or `just frontend-lint`.
4. The failure message names the rule, the offending lines and the fix.
5. The agent applies the fix and the check passes.

### Python: architecture testing with `ast`

[`backend/CLAUDE.md`](./backend/CLAUDE.md) deliberately tells the agent to query
the database straight from the controller and to skip the use-case and
repository layers. It stands in for a hallucination, a stale document or a
prompt injection. A natural task is the endpoint that
[`backend/openapi.yaml`](./backend/openapi.yaml) declares but the code does not
implement:

> Implement `GET /transactions/{id}` as described in `backend/openapi.yaml`,
> then run `just backend-architecture-test`.

The agent follows the instruction, and the [architecture
test](./backend/tests/test_architecture.py) fails: a controller may import from
the `app` package only through a `use_cases` module. The message lists the
offending import and says to route the symbol through `use_cases`. The agent
moves the query into the [repository](./backend/app/transactions/repository.py),
exposes it through a [use case](./backend/app/transactions/use_cases.py), and
the test passes. Two more rules catch further improvisation: a repository is a
module of plain functions declared `def name(*, db, ...)`, and route handlers
may live only in `*controller*` files.

### TypeScript: embedding custom ESLint rules

[`frontend/CLAUDE.md`](./frontend/CLAUDE.md) is correct, so the misdirection has
to come from the task.

> Show the total of all transaction amounts at the bottom of the list.

`just frontend-lint` fails on `local/no-amount-arithmetic`, a [custom
rule](./frontend/eslint-rules/no-amount-arithmetic.js): `amount` is the API's
decimal string and must never be coerced to a number or used in arithmetic.
Money math belongs on the backend.

> Fetch the transactions directly inside `TransactionsList` instead of through
> the loader.

`just frontend-lint` fails in
[`TransactionsList`](./frontend/src/features/transactions/components/TransactionsList.tsx)
on the [import and global boundaries](./frontend/eslint.config.js): only server
functions import `{ api }`, and components never call `fetch`. The message
points at the server function and `useLoaderData()` path.

To stage a misleading instruction on the frontend too, edit one of the two
boundary rules in [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) where the comment
invites you to.

### Where the rules live

- [`backend/tests/test_architecture.py`](./backend/tests/test_architecture.py):
  `ast` checks over the backend source. Each failure states the rule, the
  offenders and the fix, and hides the traceback so the agent sees only the
  guidance.
- [`frontend/eslint.config.js`](./frontend/eslint.config.js): the boundary rules
  and their messages, plus the overrides that define the allowed data path.
- [`frontend/eslint-rules/no-amount-arithmetic.js`](./frontend/eslint-rules/no-amount-arithmetic.js): a custom rule with its own [RuleTester
  spec](./frontend/eslint-rules/no-amount-arithmetic.test.ts) next to it.

Every message follows the same shape, rule then offenders then fix, written for
the agent as the reader. That is what turns a red check into a correction
instead of a retry loop.

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

## Disclaimer

This repository is demo code. It is not meant to run in production or to be
exposed to the internet. Dependencies are not audited or kept patched, so the
app may carry security issues inherited from the libraries it uses.

## License

[MIT](./LICENSE)

[![banner](https://raw.githubusercontent.com/nearform/.github/refs/heads/master/assets/os-banner-green.svg)](https://www.nearform.com/contact/?utm_source=open-source&utm_medium=banner&utm_campaign=os-project-pages)
