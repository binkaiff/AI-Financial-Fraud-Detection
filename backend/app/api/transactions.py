from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.fraud import FraudPredictionRequest
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.fraud_detection import predict_fraud


router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"],
)

security = HTTPBearer()


def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    transaction_data: TransactionCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    new_transaction = Transaction(
        user_id=current_user.id,
        transaction_type=transaction_data.transaction_type.strip().lower(),
        amount=transaction_data.amount,
        merchant=transaction_data.merchant.strip(),
        location=transaction_data.location.strip(),
        device_type=transaction_data.device_type.strip().lower(),
        status="pending",
        fraud_probability=None,
        risk_level=None,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.post(
    "/predict",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction_with_prediction(
    transaction_data: TransactionCreate,
    fraud_features: FraudPredictionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    prediction_result = predict_fraud(
        fraud_features.model_dump()
    )

    status_value = (
        "fraud"
        if prediction_result["prediction"] == 1
        else "legitimate"
    )

    new_transaction = Transaction(
        user_id=current_user.id,
        transaction_type=transaction_data.transaction_type.strip().lower(),
        amount=transaction_data.amount,
        merchant=transaction_data.merchant.strip(),
        location=transaction_data.location.strip(),
        device_type=transaction_data.device_type.strip().lower(),
        status=status_value,
        fraud_probability=prediction_result["fraud_probability"],
        risk_level=prediction_result["risk_level"],
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.get("/analytics")
def get_transaction_analytics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .all()
    )

    total_transactions = len(transactions)

    legitimate_transactions = sum(
        1
        for transaction in transactions
        if transaction.status == "legitimate"
    )

    fraud_transactions = sum(
        1
        for transaction in transactions
        if transaction.status == "fraud"
    )

    high_risk_transactions = sum(
        1
        for transaction in transactions
        if transaction.risk_level == "high"
    )

    total_amount = sum(
        transaction.amount
        for transaction in transactions
    )

    probabilities = [
        transaction.fraud_probability
        for transaction in transactions
        if transaction.fraud_probability is not None
    ]

    average_fraud_probability = (
        sum(probabilities) / len(probabilities)
        if probabilities
        else 0.0
    )

    return {
        "total_transactions": total_transactions,
        "legitimate_transactions": legitimate_transactions,
        "fraud_transactions": fraud_transactions,
        "high_risk_transactions": high_risk_transactions,
        "average_fraud_probability": round(
            average_fraud_probability,
            6,
        ),
        "total_transaction_amount": round(
            total_amount,
            2,
        ),
    }


@router.get(
    "/alerts",
    response_model=list[TransactionResponse],
)
def get_fraud_alerts(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    alerts = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            (
                (Transaction.status == "fraud")
                | (Transaction.risk_level == "high")
                | (Transaction.risk_level == "medium")
            ),
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return alerts


@router.get(
    "",
    response_model=list[TransactionResponse],
)
def get_transaction_history(
    transaction_type: str | None = Query(default=None),
    merchant: str | None = Query(default=None),
    location: str | None = Query(default=None),
    status_filter: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    min_amount: float | None = Query(default=None, ge=0),
    max_amount: float | None = Query(default=None, ge=0),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    query = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
    )

    if transaction_type:
        query = query.filter(
            Transaction.transaction_type
            == transaction_type.strip().lower()
        )

    if merchant:
        query = query.filter(
            Transaction.merchant.ilike(
                f"%{merchant.strip()}%"
            )
        )

    if location:
        query = query.filter(
            Transaction.location.ilike(
                f"%{location.strip()}%"
            )
        )

    if status_filter:
        query = query.filter(
            Transaction.status
            == status_filter.strip().lower()
        )

    if risk_level:
        query = query.filter(
            Transaction.risk_level
            == risk_level.strip().lower()
        )

    if min_amount is not None:
        query = query.filter(
            Transaction.amount >= min_amount
        )

    if max_amount is not None:
        query = query.filter(
            Transaction.amount <= max_amount
        )

    transactions = (
        query
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return transactions

@router.delete("/reset")
def reset_my_transaction_data(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Delete all transactions and receipt data owned by the current user."""
    from app.services.data_cleanup import reset_user_data

    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    try:
        result = reset_user_data(
            db,
            user_id=current_user.id,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to reset your transaction data.",
        )

    return {
        "message": "Your transaction and receipt data has been reset successfully.",
        **result,
    }


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Delete one transaction owned by the current user and its linked receipt data."""
    from app.services.data_cleanup import delete_transaction_with_receipts

    current_user = get_current_user_from_token(
        credentials,
        db,
    )

    try:
        result = delete_transaction_with_receipts(
            db,
            user_id=current_user.id,
            transaction_id=transaction_id,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete the transaction.",
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return {
        "message": "Transaction deleted successfully.",
        **result,
    }
