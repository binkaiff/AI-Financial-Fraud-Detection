import joblib
import pandas as pd


MODEL_PATH = "models/logistic_regression_model.joblib"
SCALER_PATH = "models/scaler.joblib"
TEST_DATA_PATH = "data/processed/test.csv"


def main():
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    test_df = pd.read_csv(TEST_DATA_PATH)

    sample = test_df.drop("Class", axis=1).iloc[[0]].copy()

    # The processed test data is already scaled,
    # so we can directly predict with the trained model.
    prediction = model.predict(sample)[0]
    probability = model.predict_proba(sample)[0][1]

    print("Prediction:", int(prediction))
    print(f"Fraud probability: {probability:.6f}")

    if probability >= 0.70:
        risk_level = "high"
    elif probability >= 0.30:
        risk_level = "medium"
    else:
        risk_level = "low"

    print("Risk level:", risk_level)


if __name__ == "__main__":
    main()