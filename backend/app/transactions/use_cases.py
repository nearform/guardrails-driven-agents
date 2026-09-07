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
