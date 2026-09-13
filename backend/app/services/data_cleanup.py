import shutil
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.receipt import Receipt
from app.models.transaction import Transaction
from app.models.user import User


BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads" / "receipts"


def _user_upload_dir(user_id: int) -> Path:
    return UPLOAD_DIR / str(user_id)


def _delete_receipt_files(
    user_id: int,
    receipt_ids: list[str],
) -> None:
    user_dir = _user_upload_dir(user_id)

    if not user_dir.exists():
        return

    for receipt_id in receipt_ids:
        for file_path in user_dir.glob(f"{receipt_id}.*"):
            if file_path.is_file():
                file_path.unlink(missing_ok=True)

    try:
        if not any(user_dir.iterdir()):
            user_dir.rmdir()
    except OSError:
        pass


def delete_transaction_with_receipts(
    db: Session,
    *,
    user_id: int,
    transaction_id: int,
) -> dict | None:
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        .first()
    )

    if transaction is None:
        return None

    receipt_ids = [
        receipt.receipt_id
        for receipt in (
            db.query(Receipt)
            .filter(
                Receipt.user_id == user_id,
                Receipt.transaction_id == transaction_id,
            )
            .all()
        )
    ]

    try:
        receipt_count = (
            db.query(Receipt)
            .filter(
                Receipt.user_id == user_id,
                Receipt.transaction_id == transaction_id,
            )
            .delete(synchronize_session=False)
        )

        db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        ).delete(synchronize_session=False)

        db.commit()
    except Exception:
        db.rollback()
        raise

    _delete_receipt_files(
        user_id,
        receipt_ids,
    )

    return {
        "transaction_id": transaction_id,
        "deleted_receipts": receipt_count,
    }


def reset_user_data(
    db: Session,
    *,
    user_id: int,
) -> dict:
    receipt_ids = [
        receipt.receipt_id
        for receipt in (
            db.query(Receipt)
            .filter(Receipt.user_id == user_id)
            .all()
        )
    ]

    transaction_count = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .count()
    )

    receipt_count = len(receipt_ids)

    try:
        db.query(Receipt).filter(
            Receipt.user_id == user_id
        ).delete(synchronize_session=False)

        db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).delete(synchronize_session=False)

        db.commit()
    except Exception:
        db.rollback()
        raise

    user_dir = _user_upload_dir(user_id)

    if user_dir.exists():
        shutil.rmtree(
            user_dir,
            ignore_errors=True,
        )

    return {
        "deleted_transactions": transaction_count,
        "deleted_receipts": receipt_count,
    }


def delete_user_and_data(
    db: Session,
    *,
    user: User,
) -> dict:
    user_id = user.id

    receipt_count = (
        db.query(Receipt)
        .filter(Receipt.user_id == user_id)
        .count()
    )

    transaction_count = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .count()
    )

    try:
        db.query(Receipt).filter(
            Receipt.user_id == user_id
        ).delete(synchronize_session=False)

        db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).delete(synchronize_session=False)

        db.query(User).filter(
            User.id == user_id
        ).delete(synchronize_session=False)

        db.commit()
    except Exception:
        db.rollback()
        raise

    user_dir = _user_upload_dir(user_id)

    if user_dir.exists():
        shutil.rmtree(
            user_dir,
            ignore_errors=True,
        )

    return {
        "deleted_user_id": user_id,
        "deleted_transactions": transaction_count,
        "deleted_receipts": receipt_count,
    }
