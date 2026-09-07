from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from litestar import Litestar
from piccolo.apps.migrations.commands.forwards import run_forwards
from piccolo.engine import engine_finder
from piccolo.engine.base import Engine


async def apply_migrations() -> None:
    """Apply all pending migrations programmatically (e.g. on app startup)."""
    result = await run_forwards(app_name="ledger")
    if not result.success:
        raise RuntimeError(f"Migrations failed: {result.message}")


def provide_db() -> Engine:
    """Return the configured Piccolo engine (from `piccolo_conf.py`).

    Wired as a Litestar dependency named `db`, so controllers receive it as a
    parameter and pass it down to use cases / repositories. Overriding this
    dependency is the seam used to swap the database in tests.
    """
    engine = engine_finder()
    if engine is None:
        raise RuntimeError("No Piccolo engine found; check piccolo_conf.py")
    return engine


@asynccontextmanager
async def database_connection_pool(app: Litestar) -> AsyncGenerator[None, None]:
    """Open the Piccolo connection pool for the app's lifetime.

    Piccolo's recommended pattern: start the pool on startup, close it on
    shutdown. Once started, all queries reuse pooled connections automatically.
    """
    engine = provide_db()
    await engine.start_connection_pool()
    try:
        yield
    finally:
        await engine.close_connection_pool()
