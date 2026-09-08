import asyncio
import os

# Point Piccolo at the test config (a dedicated `ledger_test` database) before any
# app/piccolo import resolves the engine, so even a bare `uv run pytest` is safe.
# The `backend-test` recipe sets this too; `setdefault` keeps an explicit override
# (e.g. CI running against `piccolo_conf`) working.
os.environ.setdefault("PICCOLO_CONF", "piccolo_conf_test")

import asyncpg  # noqa: E402
import pytest  # noqa: E402

from app.config import database_settings_for_tests  # noqa: E402
from app.db.tables import Transaction  # noqa: E402


async def _ensure_test_database() -> None:
    """Create the test database if it doesn't exist yet.

    Postgres won't create a database on connect, so we connect to the maintenance
    `postgres` database (same credentials) and `CREATE DATABASE` if missing. The
    name is read from `DatabaseSettings` rather than the Piccolo engine, so this
    runs *before* the engine is built (the engine probes the DB on construction).
    Guarded to a `_test` suffix so it can never target the dev/prod database.
    """
    config = dict(database_settings_for_tests().piccolo_config)
    target = config["database"]
    if not target.endswith("_test"):
        raise RuntimeError(
            f"Refusing to auto-create non-test database {target!r}; "
            "the test database name must end with '_test'."
        )

    sys_conn = await asyncpg.connect(**{**config, "database": "postgres"})
    try:
        exists = await sys_conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", target
        )
        if not exists:
            await sys_conn.execute(f'CREATE DATABASE "{target}"')
    finally:
        await sys_conn.close()


@pytest.fixture(scope="session")
def setup_test_database():
    """Ensure the test database and `transaction` table exist.

    Session-scoped so it runs once no matter how many tests pull it in, directly
    or transitively through `clean_transaction_table`.
    """
    asyncio.run(_ensure_test_database())
    Transaction.create_table(if_not_exists=True).run_sync()


@pytest.fixture
def clean_transaction_table(setup_test_database):
    """Give the requesting test a clean `transaction` table.

    Uses Piccolo's `run_sync` so the fixture needs no running event loop and no
    pre-started connection pool.
    """
    Transaction.delete(force=True).run_sync()
    yield
    Transaction.delete(force=True).run_sync()


@pytest.fixture
def client(clean_transaction_table):
    """A `TestClient` bound to a fresh app, backed by a clean table.

    Function-scoped so its connection pool lives and dies inside the test,
    avoiding cross-loop conflicts with the `run_sync` cleanup between tests.
    """
    from litestar.testing import TestClient

    from app.main import create_app

    with TestClient(app=create_app()) as test_client:
        yield test_client
