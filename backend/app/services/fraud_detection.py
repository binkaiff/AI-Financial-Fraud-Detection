from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "ml" / "logistic_regression_model.joblib"
SCALER_PATH = BASE_DIR / "ml" / "scaler.joblib"


model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)


FEATURE_COLUMNS = [
    "Time",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
    "V18",
    "V19",
    "V20",
    "V21",
    "V22",
    "V23",
    "V24",
    "V25",
    "V26",
    "V27",
    "V28",
    "Amount",
]


def predict_fraud(features: dict) -> dict:
    row = pd.DataFrame(
        [[features[column] for column in FEATURE_COLUMNS]],
        columns=FEATURE_COLUMNS,
    )

    row[["Time", "Amount"]] = scaler.transform(
        row[["Time", "Amount"]]
    )

    prediction = int(model.predict(row)[0])
    fraud_probability = float(
        model.predict_proba(row)[0][1]
    )

    if fraud_probability >= 0.70:
        risk_level = "high"
    elif fraud_probability >= 0.30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "prediction": prediction,
        "fraud_probability": fraud_probability,
        "risk_level": risk_level,
    }