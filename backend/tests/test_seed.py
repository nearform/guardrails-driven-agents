from app.db.engine import provide_db
from app.db.seed import SEED_TRANSACTIONS, seed
from app.transactions import repository


async def test_seed_inserts_example_rows(clean_transaction_table) -> None:
    await seed()
    rows = await repository.select_all(db=provide_db())
    assert len(rows) == len(SEED_TRANSACTIONS)


async def test_seed_is_idempotent(clean_transaction_table) -> None:
    await seed()
    await seed()
    rows = await repository.select_all(db=provide_db())
    assert len(rows) == len(SEED_TRANSACTIONS)
