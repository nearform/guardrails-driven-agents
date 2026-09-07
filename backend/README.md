# Ledger Backend

API to track ledger transactions, built with [Litestar](https://litestar.dev/)
and [Piccolo](https://piccolo-orm.com/) on PostgreSQL.

## Operating the backend

All commands live in the root `justfile`; run `just` to list them.

```sh
just backend-install           # install dependencies
just db-up                     # start Postgres in Docker on :5432
just backend-dev               # dev server with autoreload on :8000
just backend-prod              # production server on :8000
just backend-architecture-test # AST checks, no database needed
just backend-test              # pytest, needs the DB up
just backend-quality           # format + lint with autofixes
just backend-quality-check     # format, lint and architecture checks (CI)
```

Local dev is `just db-up` then `just backend-dev`. The app applies migrations
and seeds example data on startup.

The ASGI app is `app.main:app`, built by `create_app(auto_setup=True)`. Tests
call `create_app()` without auto-setup and manage the database themselves.

Tests run against a separate `ledger_test` database, so the dev server can keep
running. `just backend-test` sets `PICCOLO_CONF=piccolo_conf_test`, and the
suite creates `ledger_test` on first run. Postgres must be up; override the
name with `PG_TEST_DATABASE`.

The AST checks in `architecture_tests/` run without a database via
`just backend-architecture-test`, and as part of `just backend-quality-check`.

## Structure

Vertical slices under `app/`, each flowing one way:
**controller → use case → repository → table**. Engine, tables and migrations
live in `app/db/`; repositories stay in their slices.

```
app/
  main.py              # create_app()
  config.py            # DatabaseSettings (PG_* env)
  db/
    engine.py          # connection pool, `db` dependency, apply_migrations()
    tables.py
    piccolo_app.py
    seed.py
    migrations/
  health/
    controller.py
  schema/
    controller.py      # serves openapi.yaml as YAML and JSON
  transactions/
    controller.py
    use_cases.py
    repository.py      # the only module that imports tables or runs queries
architecture_tests/
  test_architecture.py
```

The repository is the only layer that talks to the database; its functions take
the engine `db` explicitly, which controllers receive by dependency injection.
An architecture test enforces this.

## Database

- The engine is built in `piccolo_conf.py` from `DatabaseSettings` in
  `app/config.py`. Tests use `piccolo_conf_test.py` (selected via
  `PICCOLO_CONF`), which swaps the database name to `ledger_test`.
- Connection settings come from `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`
  and `PG_PASSWORD`; see [`.env.example`](./.env.example). Defaults match the
  Docker `db` service, so `just db-up` works without a `.env`.
- On startup the app applies migrations and seeds data (`migrate_and_seed` in
  `app/main.py`). Both steps are idempotent.
- After changing a table, generate the migration with
  `just backend-migrations-new`; the app applies it on the next startup.
- `app/db/seed.py` inserts a few example transactions and skips if the table
  already has rows.

## Endpoints

| Method | Path                   | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| `GET`  | `/health`              | `{"status": "ok"}`                   |
| `POST` | `/transactions`        | Create a transaction (returns `201`) |
| `GET`  | `/transactions`        | List all transactions                |
| `GET`  | `/schema/openapi.yaml` | OpenAPI spec (YAML)                  |
| `GET`  | `/schema/openapi.json` | The same spec as JSON                |

The hand-written `openapi.yaml` (backend root) is the contract. The `schema`
slice serves it and Litestar's own OpenAPI generation is disabled. The spec
also documents planned endpoints such as `GET /transactions/{id}`.

A transaction has `id` (UUID), `sender`, `beneficiary`, `amount` (decimal),
`currency` (ISO code), `description` (optional) and `created_at`.

```sh
curl -X POST localhost:8000/transactions \
  -H 'content-type: application/json' \
  -d '{"sender":"alice","beneficiary":"bob","amount":"42.50","currency":"EUR","description":"lunch"}'
```

## Docker

See [Running in Docker](../README.md#running-in-docker) in the root README and
the image notes in [CLAUDE.md](./CLAUDE.md).
