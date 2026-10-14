from uuid import UUID

from litestar import get, post
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException
from litestar.params import FromPath
from litestar.status_codes import HTTP_201_CREATED
from piccolo.engine.base import Engine

from app.db.tables import Transaction
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


@get("/transactions/{id:uuid}")
async def get_transaction(id: FromPath[UUID], db: Db) -> use_cases.TransactionRead:
    async with db.transaction():
        row = await Transaction.select().where(Transaction.id == id).first()
    if row is None:
        raise NotFoundException(detail="Not Found")
    return use_cases.TransactionRead.model_validate(row)
