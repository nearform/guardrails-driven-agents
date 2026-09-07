from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from litestar import Litestar
from litestar.di import Provide

from app.db.engine import apply_migrations, database_connection_pool, provide_db
from app.db.seed import seed
from app.health.controller import health_check
from app.schema.controller import openapi_json, openapi_yaml
from app.transactions.controller import create_transaction, list_transactions


@asynccontextmanager
async def migrate_and_seed(app: Litestar) -> AsyncGenerator[None, None]:
    """Apply migrations and seed example data on startup.

    Runs after the connection pool is open. Both steps are idempotent, so this is
    safe on every boot (and convenient with the ephemeral, wiped-each-run DB).
    """
    await apply_migrations()
    await seed()
    yield


def create_app(auto_setup: bool = False) -> Litestar:
    """Build a configured Litestar app.

    A factory keeps construction in one place, so tests can spin up a fresh app
    (and override the `db` dependency) without import-time side effects.

    With ``auto_setup=True`` the app migrates and seeds on startup, so no separate
    ``migrate``/``seed`` command is needed. Tests use the default (off) so they
    control the database themselves.
    """
    lifespan = [database_connection_pool]
    if auto_setup:
        lifespan.append(migrate_and_seed)
    return Litestar(
        route_handlers=[
            health_check,
            create_transaction,
            list_transactions,
            openapi_yaml,
            openapi_json,
        ],
        dependencies={"db": Provide(provide_db, sync_to_thread=False)},
        lifespan=lifespan,
        # The hand-written `openapi.yaml` is the source of truth (served by the
        # schema controller), so Litestar's route-introspecting OpenAPI — which
        # would claim `/schema` and could never include planned endpoints — is off.
        openapi_config=None,
    )


app = create_app(auto_setup=True)
