from decimal import Decimal

from piccolo.engine.base import Engine

from app.db.tables import Transaction
from app.transactions.schemas import TransactionRead


async def insert(
    *,
    db: Engine,
    sender: str,
    beneficiary: str,
    amount: Decimal,
    currency: str,
    description: str | None = None,
) -> TransactionRead:
    transaction = Transaction(
        sender=sender,
        beneficiary=beneficiary,
        amount=amount,
        currency=currency,
        description=description,
    )
    async with db.transaction():
        await transaction.save()
    return TransactionRead.model_validate(transaction.to_dict())


async def select_all(*, db: Engine) -> list[TransactionRead]:
    async with db.transaction():
        rows = await Transaction.select()
    return [TransactionRead.model_validate(row) for row in rows]
