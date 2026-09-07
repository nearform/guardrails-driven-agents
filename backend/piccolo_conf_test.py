from piccolo.conf.apps import AppRegistry
from piccolo.engine.postgres import PostgresEngine

from app.config import database_settings_for_tests

# Test Piccolo config: identical to `piccolo_conf.py` but pointed at a dedicated
# database so the suite never touches the dev/prod `ledger` data. Selected via the
# `PICCOLO_CONF=piccolo_conf_test` env var (set by the `backend-test` recipe and
# defaulted in `tests/conftest.py`).
DB = PostgresEngine(config=database_settings_for_tests().piccolo_config)

APP_REGISTRY = AppRegistry(apps=["app.db.piccolo_app"])
