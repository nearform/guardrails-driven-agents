from litestar import get, post
from litestar.di import NamedDependency
from litestar.status_codes import HTTP_201_CREATED
from piccolo.engine.base import Engine

from app.transactions import use_cases

Db = NamedDependency[Engine]


@post("/transactions", status_code=HTTP_201_CREATED)
async def create_transaction(
    data: use_cases.TransactionCreate, db: Db
) -> use_cases.TransactionRead:
    return await use_cases.create_transaction(db, data)


@get("/transactions")
async def list_transactions(db: Db) -> list[use_cases.TransactionRead]:
    return await use_cases.list_transactions(db)
