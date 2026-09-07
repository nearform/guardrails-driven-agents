import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    """Postgres connection settings, read from ``PG_*`` environment variables.

    Single source of truth for the database config: ``piccolo_conf.py`` builds the
    production engine from it, and ``piccolo_conf_test.py`` reuses it with the
    database name overridden for the test suite. Defaults match the Docker `db`
    service, so a local `just db-up` works without any `.env`.
    """

    model_config = SettingsConfigDict(env_prefix="PG_")

    host: str = "localhost"
    port: int = 5432
    database: str = "ledger"
    user: str = "ledger"
    password: str = "ledger"

    @property
    def piccolo_config(self) -> dict[str, object]:
        """Return the dict expected by ``PostgresEngine(config=...)``."""
        return {
            "host": self.host,
            "port": self.port,
            "database": self.database,
            "user": self.user,
            "password": self.password,
        }


def database_settings_for_tests() -> DatabaseSettings:
    """Settings for the test suite: the same connection, separate database.

    Defaults the database to ``ledger_test`` (override with ``PG_TEST_DATABASE``).
    The explicit ``database`` wins over any ``PG_DATABASE`` env var. Used by
    ``piccolo_conf_test.py`` and by the test fixtures to create the database —
    resolving the name from here (rather than the engine) avoids building the
    engine before the database exists.
    """
    return DatabaseSettings(database=os.getenv("PG_TEST_DATABASE", "ledger_test"))
