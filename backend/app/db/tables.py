from piccolo.columns import UUID, Numeric, Timestamptz, Varchar
from piccolo.table import Table


class Transaction(Table):
    """A single money movement: `sender` pays `amount` to `beneficiary`."""

    id = UUID(primary_key=True)
    sender = Varchar()
    beneficiary = Varchar()
    amount = Numeric(digits=(12, 2))
    currency = Varchar(length=3)
    description = Varchar(null=True)
    created_at = Timestamptz()
