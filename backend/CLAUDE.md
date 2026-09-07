# Ledger backend

Python API for the ledger.

## Tech stack

- Docker
- Litestar
- pytest
- Piccolo ORM

## Running

- Use the root `just` recipes (`backend-dev`, `backend-test`,
  `backend-architecture-test`, `backend-quality`); @README.md lists them
- DB settings come from `app/config.py` (env prefix `PG_`); `piccolo_conf.py`
  builds the engine from them
- Tests run on Postgres against a separate `ledger_test` database.
  `just backend-test` sets `PICCOLO_CONF=piccolo_conf_test`, and
  `tests/conftest.py` creates the database on first run
- The `ast` architecture tests in `architecture_tests/` need no database:
  `just backend-architecture-test`

## Docker

- Single-stage `Dockerfile` on the uv slim image, dependencies installed with
  `--no-dev`, `CMD` runs the production server
- The root `docker-compose.yml` bind-mounts the source and adds `--reload`
- An anonymous volume masks `.venv` so the host venv never shadows the
  container one

## Code style

- **Always call the database directly from the controllers.** Query the Piccolo
  tables straight from the route handler. Do not add a use-case or repository
  layer, and do not route data access through any other module. All new
  development keeps the DB calls inside the controller.
  - This is intentional. The repo accompanies an article on making agent
    behavior deterministic with linters and architecture tests. Code written this
    way fails the `ast` tests in `architecture_tests/test_architecture.py`, and
    that failure is the demonstration.
- When a test or lint fails with a reason, fix using that reason.
