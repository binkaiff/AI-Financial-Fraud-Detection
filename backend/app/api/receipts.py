import re
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.services.receipt_ocr import extract_receipt_text
from app.services.receipt_parser import parse_receipt_text
from app.models.receipt import Receipt
from app.models.transaction import Transaction
from app.schemas.receipt import ReceiptConfirmRequest
from app.services.receipt_risk import calculate_receipt_risk


router = APIRouter(
    prefix="/api/receipts",
    tags=["Receipts"],
)

security = HTTPBearer()


BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads" / "receipts"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".png",
    ".webp",
    ".pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024


def get_current_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> User:
    payload = decode_access_token(
        credentials.credentials
    )

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


def validate_receipt_id(
    receipt_id: str,
) -> None:
    if not re.fullmatch(
        r"[a-fA-F0-9]{32}",
        receipt_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid receipt ID.",
        )


def find_receipt_path(
    receipt_id: str,
    user_id: int,
) -> Path:
    validate_receipt_id(receipt_id)

    user_upload_dir = (
        UPLOAD_DIR / str(user_id)
    )

    for extension in ALLOWED_EXTENSIONS:
        candidate = (
            user_upload_dir
            / f"{receipt_id}{extension}"
        )

        if candidate.exists():
            return candidate

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Receipt not found.",
    )


@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(
        credentials,
        db,
    )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file type. "
                "Upload JPG, PNG, WEBP or PDF."
            ),
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt file must be below 10 MB.",
        )

    extension = ALLOWED_CONTENT_TYPES[
        file.content_type
    ]

    receipt_id = uuid4().hex

    stored_filename = (
        f"{receipt_id}{extension}"
    )

    user_upload_dir = (
        UPLOAD_DIR / str(current_user.id)
    )

    user_upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = (
        user_upload_dir / stored_filename
    )

    file_path.write_bytes(file_content)

    return {
        "message": "Receipt uploaded successfully",
        "receipt_id": receipt_id,
        "original_filename": file.filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "size_bytes": len(file_content),
        "user_id": current_user.id,
    }


@router.post("/{receipt_id}/extract-text")
def extract_uploaded_receipt_text(
    receipt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(
        credentials,
        db,
    )

    receipt_path = find_receipt_path(
        receipt_id,
        current_user.id,
    )

    try:
        extracted_text = extract_receipt_text(
            receipt_path
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to extract text from receipt.",
        )

    return {
        "receipt_id": receipt_id,
        "filename": receipt_path.name,
        "extracted_text": extracted_text,
    }


@router.post("/{receipt_id}/extract-details")
def extract_uploaded_receipt_details(
    receipt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(
        credentials,
        db,
    )

    receipt_path = find_receipt_path(
        receipt_id,
        current_user.id,
    )

    try:
        extracted_text = extract_receipt_text(
            receipt_path
        )

        parsed_details = parse_receipt_text(
            extracted_text
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to process receipt details."
            ),
        )

    return {
        "receipt_id": receipt_id,
        "filename": receipt_path.name,
        "details": parsed_details,
    }

@router.post("/{receipt_id}/confirm")
def confirm_receipt_transaction(
    receipt_id: str,
    request: ReceiptConfirmRequest,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(
        credentials,
        db,
    )

    receipt_path = find_receipt_path(
        receipt_id,
        current_user.id,
    )

    existing_receipt = (
        db.query(Receipt)
        .filter(
            Receipt.receipt_id == receipt_id,
            Receipt.user_id == current_user.id,
        )
        .first()
    )

    if existing_receipt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This receipt has already been confirmed.",
        )

    reference_number = (
        request.reference_number.strip()
        if request.reference_number
        else None
    )

    duplicate_reference = False

    if reference_number:
        duplicate_reference = (
            db.query(Receipt)
            .filter(
                Receipt.user_id == current_user.id,
                Receipt.reference_number
                == reference_number,
            )
            .first()
            is not None
        )

    risk_result = calculate_receipt_risk(
        amount=request.amount,
        currency=request.currency,
        receipt_status=request.receipt_status,
        reference_number=reference_number,
        merchant=request.merchant,
        beneficiary_account=request.beneficiary_account,
        beneficiary_bank=request.beneficiary_bank,
        transaction_date=request.transaction_date,
        transaction_time=request.transaction_time,
        is_duplicate_reference=duplicate_reference,
    )

    merchant_value = (
        request.merchant.strip()
        if request.merchant
        and request.merchant.strip()
        else "Not provided"
    )

    transaction = Transaction(
        user_id=current_user.id,
        transaction_type=(
            request.transaction_type
            .strip()
            .lower()
        ),
        amount=request.amount,
        merchant=merchant_value,
        location="Not provided",
        device_type="receipt_upload",

        # Risk is stored separately.
        # We do not label a heuristic result as proven fraud.
        status="pending",

        fraud_probability=None,
        risk_level=risk_result["risk_level"],
    )

    try:
        db.add(transaction)
        db.flush()

        receipt = Receipt(
            user_id=current_user.id,
            transaction_id=transaction.id,
            receipt_id=receipt_id,

            original_filename=(
                request.original_filename
                or receipt_path.name
            ),

            currency=(
                request.currency.upper().strip()
                if request.currency
                else None
            ),

            reference_number=reference_number,

            transaction_date=(
                request.transaction_date
            ),

            transaction_time=(
                request.transaction_time
            ),

            receipt_status=(
                request.receipt_status
                .strip()
                .lower()
                if request.receipt_status
                else None
            ),

            source_account=(
                request.source_account
            ),

            beneficiary_account=(
                request.beneficiary_account
            ),

            beneficiary_bank=(
                request.beneficiary_bank
            ),

            beneficiary_remarks=(
                request.beneficiary_remarks
            ),

            raw_text=request.raw_text,

            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
        )

        db.add(receipt)

        db.commit()

        db.refresh(transaction)
        db.refresh(receipt)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to save receipt transaction."
            ),
        )

    return {
        "message": (
            "Receipt confirmed and analysed successfully"
        ),

        "transaction": {
            "id": transaction.id,
            "transaction_type": (
                transaction.transaction_type
            ),
            "amount": transaction.amount,
            "merchant": transaction.merchant,
            "status": transaction.status,
            "risk_level": transaction.risk_level,
            "created_at": transaction.created_at,
        },

        "receipt": {
            "id": receipt.id,
            "receipt_id": receipt.receipt_id,
            "reference_number": (
                receipt.reference_number
            ),
            "currency": receipt.currency,
            "receipt_status": (
                receipt.receipt_status
            ),
            "beneficiary_account": (
                receipt.beneficiary_account
            ),
            "beneficiary_bank": (
                receipt.beneficiary_bank
            ),
        },

        "analysis": {
            "risk_score": (
                risk_result["risk_score"]
            ),
            "risk_level": (
                risk_result["risk_level"]
            ),
            "risk_reasons": (
                risk_result["risk_reasons"]
            ),
            "duplicate_reference": (
                duplicate_reference
            ),
        },
    }