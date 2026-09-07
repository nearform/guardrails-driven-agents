from piccolo.conf.apps import AppRegistry
from piccolo.engine.postgres import PostgresEngine

from app.config import DatabaseSettings

# Connection config comes from `DatabaseSettings` (PG_* env vars); defaults match
# the Postgres container (see docker-compose.yml) so local development works out
# of the box after `just db-up`.
DB = PostgresEngine(config=DatabaseSettings().piccolo_config)

APP_REGISTRY = AppRegistry(apps=["app.db.piccolo_app"])
