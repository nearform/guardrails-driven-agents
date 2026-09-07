from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    sender: str = Field(min_length=1)
    beneficiary: str = Field(min_length=1)
    # max_digits/decimal_places mirror Numeric(12, 2); gt=0 forbids zero and negatives.
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    description: str | None = Field(default=None, max_length=255)


class TransactionRead(BaseModel):
    """A single transaction as returned by the API (mirrors the `Transaction` table)."""

    id: UUID
    sender: str
    beneficiary: str
    amount: Decimal
    currency: str
    description: str | None = None
    created_at: datetime
