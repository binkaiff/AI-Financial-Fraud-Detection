from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    transaction_type = Column(
        String(50),
        nullable=False,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    merchant = Column(
        String(150),
        nullable=False,
    )

    location = Column(
        String(150),
        nullable=False,
    )

    device_type = Column(
        String(100),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    fraud_probability = Column(
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