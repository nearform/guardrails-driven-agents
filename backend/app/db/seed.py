import asyncio
from decimal import Decimal

from app.db.tables import Transaction

# Example ledger transactions inserted into a fresh database.
SEED_TRANSACTIONS = [
    {
        "sender": "alice",
        "beneficiary": "bob",
        "amount": Decimal("42.50"),
        "currency": "EUR",
        "description": "lunch",
    },
    {
        "sender": "carol",
        "beneficiary": "dave",
        "amount": Decimal("1200.00"),
        "currency": "USD",
        "description": "rent",
    },
    {
        "sender": "erin",
        "beneficiary": "frank",
        "amount": Decimal("19.99"),
        "currency": "GBP",
        "description": "book",
    },
    {
        "sender": "grace",
        "beneficiary": "heidi",
        "amount": Decimal("250.75"),
        "currency": "EUR",
        "description": None,
    },
]


async def seed() -> None:
    """Insert the example transactions if the table is empty (idempotent)."""
    existing = await Transaction.count()
    if existing:
        print(f"Database already has {existing} transaction(s); skipping seed.")
        return
    await Transaction.insert(*(Transaction(**row) for row in SEED_TRANSACTIONS))
    print(f"Seeded {len(SEED_TRANSACTIONS)} transaction(s).")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
