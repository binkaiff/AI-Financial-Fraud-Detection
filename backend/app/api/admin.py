from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.admin import get_current_admin
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


@router.get(
    "/users",
    response_model=list[UserResponse],
)
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return users


@router.get("/analytics")
def get_admin_analytics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()

    total_transactions = db.query(Transaction).count()

    fraud_transactions = (
        db.query(Transaction)
        .filter(Transaction.status == "fraud")
        .count()
    )

    legitimate_transactions = (
        db.query(Transaction)
        .filter(Transaction.status == "legitimate")
        .count()
    )

    high_risk_transactions = (
        db.query(Transaction)
        .filter(Transaction.risk_level == "high")
        .count()
    )

    transactions = db.query(Transaction).all()

    total_transaction_amount = sum(
        transaction.amount
        for transaction in transactions
    )

    return {
        "total_users": total_users,
        "total_transactions": total_transactions,
        "fraud_transactions": fraud_transactions,
        "legitimate_transactions": legitimate_transactions,
        "high_risk_transactions": high_risk_transactions,
        "total_transaction_amount": round(
            total_transaction_amount,
            2,
        ),
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a normal user and all data owned by that user."""
    from fastapi import HTTPException, status
    from app.services.data_cleanup import delete_user_and_data

    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account.",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts are protected from deletion.",
        )

    target_name = target_user.full_name
    target_email = target_user.email

    try:
        result = delete_user_and_data(
            db,
            user=target_user,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete the user.",
        )

    return {
        "message": "User deleted successfully.",
        "deleted_user": {
            "id": user_id,
            "full_name": target_name,
            "email": target_email,
        },
        **result,
    }
