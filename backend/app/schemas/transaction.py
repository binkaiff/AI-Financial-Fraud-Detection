from datetime import datetime

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    transaction_type: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    amount: float = Field(
        ...,
        gt=0,
    )

    merchant: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    device_type: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    transaction_type: str
    amount: float
    merchant: str
    location: str
    device_type: str
    status: str
    fraud_probability: float | None
    risk_level: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }