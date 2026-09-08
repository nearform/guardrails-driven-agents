# Load backend/.env (if present) so recipes pick up PG_* overrides.
set dotenv-load := true
set dotenv-path := "backend/.env"
set dotenv-required := false

# List available recipes.
default:
    @just --list

# Install backend dependencies.
[working-directory: 'backend']
backend-install:
    uv sync

# Run the backend dev server with autoreload (migrates and seeds on startup).
[working-directory: 'backend']
backend-dev:
    uv run litestar --app app.main:app run --reload

# Run the backend production server locally (no autoreload).
[working-directory: 'backend']
backend-prod:
    uv run litestar --app app.main:app run --host 0.0.0.0 --port 8000

# Run the backend test suite (against the dedicated `ledger_test` database).
[working-directory: 'backend']
backend-test:
    PICCOLO_CONF=piccolo_conf_test uv run pytest

# Run the pure AST architecture suite (no database required).
[working-directory: 'backend']
backend-architecture-test:
    uv run pytest tests/test_architecture.py

# Format + lint the backend with autofixes (dev).
[working-directory: 'backend']
backend-quality:
    uv run ruff format .
    uv run ruff check --fix .

# Format, lint and architecture checks in check-only mode (CI).
[working-directory: 'backend']
backend-quality-check:
    uv run ruff format --check .
    uv run ruff check .
    uv run pytest tests/test_architecture.py

# Generate a new auto migration from the current table definitions.
[working-directory: 'backend']
backend-migrations-new:
    uv run piccolo migrations new ledger --auto

# Install frontend dependencies.
[working-directory: 'frontend']
frontend-install:
    npm install

# Run the frontend dev server with autoreload (host: http://localhost:3000).
[working-directory: 'frontend']
frontend-dev:
    npm run dev

# Regenerate the Massimo API client from backend/openapi.yaml.
[working-directory: 'frontend']
frontend-gen-api:
    npm run gen:api

# Type-check the frontend (tsc, no emit).
[working-directory: 'frontend']
frontend-typecheck:
    npm run typecheck

# Lint the frontend.
[working-directory: 'frontend']
frontend-lint:
    npm run lint

# Run the frontend test suite (Vitest + Testing Library).
[working-directory: 'frontend']
frontend-test:
    npm run test

# Format + lint (autofix) + typecheck the frontend (dev).
[working-directory: 'frontend']
frontend-quality:
    npm run format
    npm run lint:fix
    npm run typecheck

# Format, lint and typecheck the frontend in check-only mode (CI).
[working-directory: 'frontend']
frontend-quality-check:
    npm run format:check
    npm run lint
    npm run typecheck

# Start only the Postgres container (for local host-side development).
db-up:
    docker compose up -d db

# Stop the Postgres container.
db-down:
    docker compose stop db

# Launch the whole app in Docker (the backend auto-migrates and seeds on startup).
up:
    docker compose up --build

# Stop and remove the containers.
docker-down:
    docker compose down
