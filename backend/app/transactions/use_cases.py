from uuid import UUID

from litestar.exceptions import NotFoundException
from piccolo.engine.base import Engine

from app.transactions import repository
from app.transactions.schemas import TransactionCreate, TransactionRead

__all__ = ["TransactionCreate", "TransactionRead"]


async def create_transaction(db: Engine, data: TransactionCreate) -> TransactionRead:
    return await repository.insert(
        db=db,
        sender=data.sender,
        beneficiary=data.beneficiary,
        amount=data.amount,
        currency=data.currency,
        description=data.description,
    )


async def list_transactions(db: Engine) -> list[TransactionRead]:
    return await repository.select_all(db=db)


async def get_transaction(db: Engine, id: UUID) -> TransactionRead:
    transaction = await repository.select_by_id(db=db, id=id)
    if transaction is None:
        raise NotFoundException(detail="Not Found")
    return transaction
