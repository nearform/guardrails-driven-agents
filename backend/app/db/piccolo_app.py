import os

from piccolo.conf.apps import AppConfig

from app.db.tables import Transaction

CURRENT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))

APP_CONFIG = AppConfig(
    app_name="ledger",
    migrations_folder_path=os.path.join(CURRENT_DIRECTORY, "migrations"),
    table_classes=[Transaction],
)
