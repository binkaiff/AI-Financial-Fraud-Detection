import joblib
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


TRAIN_DATA_PATH = "data/processed/train.csv"
TEST_DATA_PATH = "data/processed/test.csv"
MODEL_OUTPUT_PATH = "models/logistic_regression_model.joblib"


def main():
    train_df = pd.read_csv(TRAIN_DATA_PATH)
    test_df = pd.read_csv(TEST_DATA_PATH)

    X_train = train_df.drop("Class", axis=1)
    y_train = train_df["Class"]

    X_test = test_df.drop("Class", axis=1)
    y_test = test_df["Class"]

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42,
    )

    print("Training model...")
    model.fit(X_train, y_train)

    print("Training complete.")

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions)
    recall = recall_score(y_test, predictions)
    f1 = f1_score(y_test, predictions)
    matrix = confusion_matrix(y_test, predictions)

    print("\n=== MODEL EVALUATION ===")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-score:  {f1:.4f}")

    print("\n=== CONFUSION MATRIX ===")
    print(matrix)

    print("\n=== CLASSIFICATION REPORT ===")
    print(classification_report(y_test, predictions))

    joblib.dump(model, MODEL_OUTPUT_PATH)

    print(f"\nModel saved to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()