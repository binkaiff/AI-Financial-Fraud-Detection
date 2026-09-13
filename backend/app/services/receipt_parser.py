import re
from typing import Any


CURRENCY_PATTERNS = {
    "LKR": [
        r"\bLKR\b",
        r"\bRs\.?\b",
        r"\bL\.?K\.?R\.?\b",
    ],
    "USD": [
        r"\bUSD\b",
        r"\$",
    ],
    "EUR": [
        r"\bEUR\b",
        r"€",
    ],
    "GBP": [
        r"\bGBP\b",
        r"£",
    ],
}


def clean_text(text: str) -> str:
    return "\n".join(
        line.strip()
        for line in text.splitlines()
        if line.strip()
    )


def extract_currency(text: str) -> str | None:
    for currency, patterns in CURRENCY_PATTERNS.items():
        for pattern in patterns:
            if re.search(
                pattern,
                text,
                flags=re.IGNORECASE,
            ):
                return currency

    return None


def parse_amount_value(
    value: str,
) -> float | None:
    try:
        cleaned = (
            value
            .replace(",", "")
            .replace(" ", "")
        )

        return float(cleaned)

    except ValueError:
        return None


def extract_amount(
    text: str,
) -> float | None:
    labelled_patterns = [
        (
            r"(?:total\s+amount|amount\s+paid|paid\s+amount|"
            r"transaction\s+amount|payment\s+amount|"
            r"grand\s+total|total|amount)"
            r"\s*[:\-]?\s*"
            r"(?:LKR|Rs\.?|USD|\$|EUR|GBP)?\s*"
            r"([0-9][0-9,\s]*\.\d{2})"
        ),
        (
            r"(?:total\s+amount|amount\s+paid|paid\s+amount|"
            r"transaction\s+amount|payment\s+amount|"
            r"grand\s+total|total|amount)"
            r"\s*[:\-]?\s*"
            r"(?:LKR|Rs\.?|USD|\$|EUR|GBP)?\s*"
            r"([0-9][0-9,\s]*)"
        ),
    ]

    for pattern in labelled_patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            amount = parse_amount_value(
                match.group(1)
            )

            if amount is not None:
                return amount

    currency_patterns = [
        (
            r"(?:LKR|Rs\.?|USD|\$|EUR|GBP)\s*"
            r"([0-9][0-9,\s]*\.\d{2})"
        ),
        (
            r"(?:LKR|Rs\.?|USD|\$|EUR|GBP)\s*"
            r"([0-9][0-9,\s]*)"
        ),
        (
            r"([0-9][0-9,\s]*\.\d{2})\s*"
            r"(?:LKR|USD|EUR|GBP)"
        ),
    ]

    for pattern in currency_patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            amount = parse_amount_value(
                match.group(1)
            )

            if amount is not None:
                return amount

    return None


def extract_date(
    text: str,
) -> str | None:
    patterns = [
        r"\b(\d{4}-\d{2}-\d{2})\b",
        r"\b(\d{2}/\d{2}/\d{4})\b",
        r"\b(\d{2}-\d{2}-\d{4})\b",
        r"\b(\d{2}\.\d{2}\.\d{4})\b",
        (
            r"\b(\d{1,2}\s+"
            r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
            r"[a-z]*\s+\d{4})\b"
        ),
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1)

    return None


def extract_time(
    text: str,
) -> str | None:
    patterns = [
        (
            r"\b("
            r"(?:0?[1-9]|1[0-2]):[0-5]\d"
            r"(?::[0-5]\d)?"
            r"\s?[APap][Mm]"
            r")\b"
        ),
        (
            r"\b("
            r"(?:[01]?\d|2[0-3]):[0-5]\d"
            r"(?::[0-5]\d)?"
            r")\b"
        ),
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
        )

        if match:
            return match.group(1)

    return None


def extract_reference_number(
    text: str,
) -> str | None:
    patterns = [
        (
            r"(?:transaction\s*(?:id|no|number)|"
            r"transaction\s*reference|"
            r"reference\s*(?:id|no|number)?|"
            r"reference|"
            r"ref\s*(?:id|no|number)?|"
            r"txn\s*(?:id|no|number)|"
            r"receipt\s*(?:id|no|number)|"
            r"invoice\s*(?:id|no|number))"
            r"\s*[:#\-]?\s*"
            r"([A-Za-z0-9\-_/]{4,})"
        ),
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

    return None


def extract_status(
    text: str,
) -> str | None:
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    # Example:
    # Status : Success
    for line in lines:
        match = re.match(
            r"^status\s*:\s*(.+)$",
            line,
            flags=re.IGNORECASE,
        )

        if match:
            value = match.group(1).strip()

            if value:
                return value.lower()

    # Example:
    # Status :
    # Success
    for index, line in enumerate(lines):
        if re.fullmatch(
            r"status\s*:?",
            line,
            flags=re.IGNORECASE,
        ):
            if index + 1 < len(lines):
                return (
                    lines[index + 1]
                    .strip()
                    .lower()
                )

    return None


def extract_source_account(
    text: str,
) -> str | None:
    match = re.search(
        r"source\s+account\s*:\s*"
        r"([A-Za-z0-9*Xx\-]+)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return match.group(1).strip()

    return None


def extract_beneficiary_account(
    text: str,
) -> str | None:
    match = re.search(
        r"beneficiary\s+account\s*:\s*"
        r"([A-Za-z0-9*Xx\-]+)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return match.group(1).strip()

    return None


def extract_beneficiary_bank(
    text: str,
) -> str | None:
    match = re.search(
        r"beneficiary\s+bank\s*:\s*(.+)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        value = match.group(1).strip()

        if value:
            return value[:150]

    return None


def extract_beneficiary_remarks(
    text: str,
) -> str | None:
    match = re.search(
        r"beneficiary\s+remarks\s*:\s*(.+)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        value = match.group(1).strip()

        if value:
            return value[:150]

    return None


def extract_merchant(
    text: str,
) -> str | None:
    """
    Extract merchant/payee only when the receipt explicitly
    provides a merchant/person name.

    Do not guess from random receipt lines.
    """

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    labels = [
        "merchant",
        "merchant name",
        "payee",
        "payee name",
        "beneficiary name",
        "recipient",
        "recipient name",
        "receiver",
        "receiver name",
        "paid to",
        "payment to",
        "transferred to",
        "account name",
        "beneficiary account name",
    ]

    # Example:
    # Merchant: ABC Store
    # Payee: John Smith
    for line in lines:
        for label in labels:
            match = re.search(
                rf"^{re.escape(label)}"
                rf"\s*[:\-]\s*(.+)$",
                line,
                flags=re.IGNORECASE,
            )

            if match:
                value = match.group(1).strip()

                if is_valid_merchant(value):
                    return value[:150]

    # Example:
    # Beneficiary Name:
    # John Smith
    for index, line in enumerate(lines):
        for label in labels:
            if re.fullmatch(
                rf"{re.escape(label)}\s*[:\-]?",
                line,
                flags=re.IGNORECASE,
            ):
                if index + 1 < len(lines):
                    value = (
                        lines[index + 1]
                        .strip()
                    )

                    if is_valid_merchant(value):
                        return value[:150]

    # Important:
    # Do NOT guess merchant from generic text such as
    # Beneficiary Remarks: Ticket.
    return None


def is_valid_merchant(
    value: str,
) -> bool:
    if not value:
        return False

    cleaned = value.strip()

    if len(cleaned) < 3:
        return False

    if cleaned.endswith(":"):
        return False

    ignored_exact = {
        "receipt",
        "payment successful",
        "payment success",
        "transaction successful",
        "transaction complete",
        "transaction completed",
        "successful",
        "success",
        "completed",
        "status",
        "status:",
        "status :",
        "thank you",
        "payment receipt",
        "transaction receipt",
        "fund transfer",
        "ticket",
    }

    if cleaned.lower() in ignored_exact:
        return False

    ignored_keywords = [
        "status",
        "successful",
        "success",
        "completed",
        "receipt",
        "transaction",
        "amount",
        "total",
        "date",
        "time",
        "reference",
        "ref no",
        "invoice",
        "currency",
        "payment status",
        "transaction id",
        "transaction no",
        "source account",
        "beneficiary account",
        "beneficiary remarks",
        "beneficiary bank",
    ]

    lowered = cleaned.lower()

    if any(
        keyword in lowered
        for keyword in ignored_keywords
    ):
        return False

    if re.search(
        r"\b\d{2}[/\-]\d{2}[/\-]\d{2,4}\b",
        cleaned,
    ):
        return False

    if re.search(
        r"\b\d{1,2}:\d{2}\b",
        cleaned,
    ):
        return False

    if re.fullmatch(
        r"[\d\s.,:/#\-]+",
        cleaned,
    ):
        return False

    if re.fullmatch(
        r"(?:LKR|USD|EUR|GBP|Rs\.?)"
        r"\s*[\d,.\s]+",
        cleaned,
        flags=re.IGNORECASE,
    ):
        return False

    return True


def extract_transaction_type(
    text: str,
) -> str:
    lowered_text = text.lower()

    if any(
        keyword in lowered_text
        for keyword in [
            "one time fund transfer",
            "fund transfer",
            "bank transfer",
            "transfer successful",
            "transferred to",
            "beneficiary account",
        ]
    ):
        return "transfer"

    if any(
        keyword in lowered_text
        for keyword in [
            "withdrawal",
            "cash withdrawal",
            "atm withdrawal",
        ]
    ):
        return "withdrawal"

    if any(
        keyword in lowered_text
        for keyword in [
            "deposit",
            "cash deposit",
        ]
    ):
        return "deposit"

    if any(
        keyword in lowered_text
        for keyword in [
            "purchase",
            "merchant",
            "store",
            "shop",
            "invoice",
        ]
    ):
        return "purchase"

    return "payment"


def parse_receipt_text(
    raw_text: str,
) -> dict[str, Any]:
    text = clean_text(raw_text)

    return {
        "merchant": extract_merchant(text),

        "amount": extract_amount(text),

        "currency": extract_currency(text),

        "transaction_date": extract_date(text),

        "transaction_time": extract_time(text),

        "reference_number": extract_reference_number(
            text
        ),

        "transaction_type": extract_transaction_type(
            text
        ),

        "status": extract_status(text),

        "source_account": extract_source_account(
            text
        ),

        "beneficiary_account": extract_beneficiary_account(
            text
        ),

        "beneficiary_bank": extract_beneficiary_bank(
            text
        ),

        "beneficiary_remarks": extract_beneficiary_remarks(
            text
        ),

        "raw_text": text,
    }