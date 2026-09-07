import decimal

from piccolo.apps.migrations.auto.migration_manager import MigrationManager
from piccolo.columns.column_types import UUID, Numeric, Timestamptz, Varchar
from piccolo.columns.defaults.timestamptz import TimestamptzNow
from piccolo.columns.defaults.uuid import UUID4
from piccolo.columns.indexes import IndexMethod

ID = "2026-06-29T11:19:03:386965"
VERSION = "1.34.0"
DESCRIPTION = ""


async def forwards():
    manager = MigrationManager(
        migration_id=ID, app_name="ledger", description=DESCRIPTION
    )

    manager.add_table(
        class_name="Transaction",
        tablename="transaction",
        schema=None,
        columns=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="id",
        db_column_name="id",
        column_class_name="UUID",
        column_class=UUID,
        params={
            "default": UUID4(),
            "null": False,
            "primary_key": True,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="sender",
        db_column_name="sender",
        column_class_name="Varchar",
        column_class=Varchar,
        params={
            "length": 255,
            "default": "",
            "null": False,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="beneficiary",
        db_column_name="beneficiary",
        column_class_name="Varchar",
        column_class=Varchar,
        params={
            "length": 255,
            "default": "",
            "null": False,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="amount",
        db_column_name="amount",
        column_class_name="Numeric",
        column_class=Numeric,
        params={
            "default": decimal.Decimal("0"),
            "digits": (12, 2),
            "null": False,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="currency",
        db_column_name="currency",
        column_class_name="Varchar",
        column_class=Varchar,
        params={
            "length": 3,
            "default": "",
            "null": False,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="description",
        db_column_name="description",
        column_class_name="Varchar",
        column_class=Varchar,
        params={
            "length": 255,
            "default": "",
            "null": True,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    manager.add_column(
        table_class_name="Transaction",
        tablename="transaction",
        column_name="created_at",
        db_column_name="created_at",
        column_class_name="Timestamptz",
        column_class=Timestamptz,
        params={
            "default": TimestamptzNow(),
            "null": False,
            "primary_key": False,
            "unique": False,
            "index": False,
            "index_method": IndexMethod.btree,
            "choices": None,
            "db_column_name": None,
            "secret": False,
        },
        schema=None,
    )

    return manager
