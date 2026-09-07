from litestar.testing import TestClient
import pytest


@pytest.fixture
def payload() -> dict[str, str | None]:
    return {
        "sender": "alice",
        "beneficiary": "bob",
        "amount": "42.50",
        "currency": "EUR",
        "description": "lunch",
    }


def test_create_transaction(client: TestClient, payload: dict) -> None:
    response = client.post("/transactions", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["created_at"]
    assert body["sender"] == payload["sender"]
    assert body["beneficiary"] == payload["beneficiary"]
    assert body["amount"] == payload["amount"]
    assert body["currency"] == payload["currency"]
    assert body["description"] == payload["description"]


def test_list_transactions_returns_created_row(
    client: TestClient, payload: dict
) -> None:
    client.post("/transactions", json=payload)
    response = client.get("/transactions")

    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    row = items[0]
    # `id` and `created_at` are server-generated; the rest echoes the request.
    assert row.pop("id")
    assert row.pop("created_at")
    assert row == payload


def test_create_transaction_without_description(
    client: TestClient, payload: dict
) -> None:
    response = client.post("/transactions", json={**payload, "description": None})

    assert response.status_code == 201
    body = response.json()
    assert body.pop("id")
    assert body.pop("created_at")
    assert body == {**payload, "description": None}


# Each case overrides one field with an invalid value and asserts the *whole* error
# body, so the exact shape Litestar returns on a validation failure is visible here.
@pytest.mark.parametrize(
    ("override", "expected_extra"),
    [
        (
            {"amount": "-1.00"},
            [{"message": "Input should be greater than 0", "key": "amount"}],
        ),
        (
            {"amount": "0"},
            [{"message": "Input should be greater than 0", "key": "amount"}],
        ),
        (
            {"amount": "1.999"},
            [
                {
                    "message": "Decimal input should have no more than 2 decimal places",
                    "key": "amount",
                }
            ],
        ),
        (
            {"amount": "10000000000.00"},
            [
                {
                    "message": (
                        "Decimal input should have no more than 10 digits "
                        "before the decimal point"
                    ),
                    "key": "amount",
                }
            ],
        ),
        (
            {"currency": "eur"},
            [
                {
                    "message": "String should match pattern '^[A-Z]{3}$'",
                    "key": "currency",
                }
            ],
        ),
        (
            {"currency": "EU"},
            [
                {
                    "message": "String should match pattern '^[A-Z]{3}$'",
                    "key": "currency",
                }
            ],
        ),
        (
            {"sender": ""},
            [{"message": "String should have at least 1 character", "key": "sender"}],
        ),
        (
            {"beneficiary": ""},
            [
                {
                    "message": "String should have at least 1 character",
                    "key": "beneficiary",
                }
            ],
        ),
        (
            {"description": "x" * 256},
            [
                {
                    "message": "String should have at most 255 characters",
                    "key": "description",
                }
            ],
        ),
    ],
)
def test_create_transaction_rejects_invalid_field(
    client: TestClient, payload: dict, override: dict, expected_extra: list
) -> None:
    response = client.post("/transactions", json={**payload, **override})

    assert response.status_code == 400
    assert response.json() == {
        "status_code": 400,
        "detail": "Validation failed for POST /transactions",
        "extra": expected_extra,
    }


def test_rejected_transaction_is_not_persisted(
    client: TestClient, payload: dict
) -> None:
    client.post("/transactions", json={**payload, "amount": "-1.00"})

    response = client.get("/transactions")
    assert response.status_code == 200
    assert response.json() == []
