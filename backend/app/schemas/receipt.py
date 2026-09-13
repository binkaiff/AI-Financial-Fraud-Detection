from pydantic import BaseModel, Field


class ReceiptConfirmRequest(BaseModel):
    merchant: str | None = None

    amount: float = Field(..., gt=0)

    currency: str | None = None

    transaction_type: str = Field(
        default="payment",
        min_length=2,
        max_length=50,
    )

    transaction_date: str | None = None
    transaction_time: str | None = None

    reference_number: str | None = None

    receipt_status: str | None = None

    source_account: str | None = None
    beneficiary_account: str | None = None
    beneficiary_bank: str | None = None
    beneficiary_remarks: str | None = None

    raw_text: str | None = None

    original_filename: str | None = None