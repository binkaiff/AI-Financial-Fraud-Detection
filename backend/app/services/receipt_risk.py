from typing import Any


SUCCESS_STATUSES = {
    "success",
    "successful",
    "completed",
    "complete",
    "approved",
    "paid",
}


def calculate_amount_risk(
    amount: float | None,
    currency: str | None,
) -> tuple[int, list[str]]:
    score = 0
    reasons = []

    if amount is None:
        return (
            20,
            ["Transaction amount is missing."],
        )

    currency_code = (
        currency.upper().strip()
        if currency
        else ""
    )

    # LKR thresholds
    if currency_code == "LKR":
        if amount >= 1_000_000:
            score += 25
            reasons.append(
                "Very high transaction amount detected."
            )

        elif amount >= 250_000:
            score += 15
            reasons.append(
                "High transaction amount detected."
            )

        elif amount >= 100_000:
            score += 8
            reasons.append(
                "Above-normal transaction amount detected."
            )

    # USD / EUR / GBP demo thresholds
    elif currency_code in {
        "USD",
        "EUR",
        "GBP",
    }:
        if amount >= 10_000:
            score += 25
            reasons.append(
                "Very high transaction amount detected."
            )

        elif amount >= 5_000:
            score += 15
            reasons.append(
                "High transaction amount detected."
            )

        elif amount >= 1_000:
            score += 8
            reasons.append(
                "Above-normal transaction amount detected."
            )

    return score, reasons


def calculate_receipt_risk(
    *,
    amount: float | None,
    currency: str | None,
    receipt_status: str | None,
    reference_number: str | None,
    merchant: str | None,
    beneficiary_account: str | None,
    beneficiary_bank: str | None,
    transaction_date: str | None,
    transaction_time: str | None,
    is_duplicate_reference: bool = False,
) -> dict[str, Any]:
    risk_score = 0
    reasons = []

    # 1. Duplicate transaction reference
    if is_duplicate_reference:
        risk_score += 45

        reasons.append(
            "Duplicate transaction reference detected."
        )

    # 2. Receipt transaction status
    if not receipt_status:
        risk_score += 10

        reasons.append(
            "Transaction status is missing."
        )

    elif (
        receipt_status
        .strip()
        .lower()
        not in SUCCESS_STATUSES
    ):
        risk_score += 30

        reasons.append(
            "Receipt does not show a successful transaction status."
        )

    # 3. Reference number
    if not reference_number:
        risk_score += 20

        reasons.append(
            "Transaction reference number is missing."
        )

    # 4. Counterparty information
    has_counterparty = any(
        [
            merchant,
            beneficiary_account,
            beneficiary_bank,
        ]
    )

    if not has_counterparty:
        risk_score += 15

        reasons.append(
            "Merchant or beneficiary information is missing."
        )

    # 5. Date and time
    if not transaction_date:
        risk_score += 8

        reasons.append(
            "Transaction date is missing."
        )

    if not transaction_time:
        risk_score += 5

        reasons.append(
            "Transaction time is missing."
        )

    # 6. Amount-based risk
    amount_score, amount_reasons = (
        calculate_amount_risk(
            amount,
            currency,
        )
    )

    risk_score += amount_score
    reasons.extend(amount_reasons)

    # Keep score between 0 and 100.
    risk_score = min(
        max(risk_score, 0),
        100,
    )

    if risk_score >= 70:
        risk_level = "high"

    elif risk_score >= 35:
        risk_level = "medium"

    else:
        risk_level = "low"

    if not reasons:
        reasons.append(
            "No major receipt-based risk indicators detected."
        )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_reasons": reasons,
    }