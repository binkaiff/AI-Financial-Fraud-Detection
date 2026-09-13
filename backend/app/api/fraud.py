from fastapi import APIRouter

from app.schemas.fraud import (
    FraudPredictionRequest,
    FraudPredictionResponse,
)
from app.services.fraud_detection import predict_fraud


router = APIRouter(
    prefix="/api/fraud",
    tags=["Fraud Detection"],
)


@router.post(
    "/predict",
    response_model=FraudPredictionResponse,
)
def predict_fraud_transaction(
    request: FraudPredictionRequest,
):
    features = request.model_dump()

    result = predict_fraud(features)

    return result