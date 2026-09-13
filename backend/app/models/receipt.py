from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=True,
        index=True,
    )

    receipt_id = Column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )

    original_filename = Column(
        String(255),
        nullable=True,
    )

    currency = Column(
        String(10),
        nullable=True,
    )

    reference_number = Column(
        String(150),
        nullable=True,
        index=True,
    )

    transaction_date = Column(
        String(50),
        nullable=True,
    )

    transaction_time = Column(
        String(50),
        nullable=True,
    )

    receipt_status = Column(
        String(50),
        nullable=True,
    )

    source_account = Column(
        String(150),
        nullable=True,
    )

    beneficiary_account = Column(
        String(150),
        nullable=True,
    )

    beneficiary_bank = Column(
        String(200),
        nullable=True,
    )

    beneficiary_remarks = Column(
        String(255),
        nullable=True,
    )

    raw_text = Column(
        Text,
        nullable=True,
    )

    risk_score = Column(
        Float,
        nullable=True,
    )

    risk_level = Column(
        String(30),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )