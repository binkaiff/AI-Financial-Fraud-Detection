import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


RAW_DATA_PATH = "data/raw/creditcard.csv"
PROCESSED_TRAIN_PATH = "data/processed/train.csv"
PROCESSED_TEST_PATH = "data/processed/test.csv"
SCALER_OUTPUT_PATH = "models/scaler.joblib"


def main():
    # Load dataset
    df = pd.read_csv(RAW_DATA_PATH)

    print("Original dataset shape:", df.shape)

    # Remove exact duplicate rows
    df = df.drop_duplicates()

    print("Shape after removing duplicates:", df.shape)

    # Separate features and target
    X = df.drop("Class", axis=1)
    y = df["Class"]

    # Split BEFORE scaling to avoid data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    # Create scaler
    scaler = StandardScaler()

    # Fit scaler ONLY on training data
    X_train = X_train.copy()
    X_test = X_test.copy()

    X_train[["Time", "Amount"]] = scaler.fit_transform(
        X_train[["Time", "Amount"]]
    )

    # Use the same scaler to transform test data
    X_test[["Time", "Amount"]] = scaler.transform(
        X_test[["Time", "Amount"]]
    )

    # Save fitted scaler
    joblib.dump(
        scaler,
        SCALER_OUTPUT_PATH,
    )

    print(f"Scaler saved to: {SCALER_OUTPUT_PATH}")

    # Add target column back
    train_df = X_train.copy()
    train_df["Class"] = y_train

    test_df = X_test.copy()
    test_df["Class"] = y_test

    # Save processed datasets
    train_df.to_csv(
        PROCESSED_TRAIN_PATH,
        index=False,
    )

    test_df.to_csv(
        PROCESSED_TEST_PATH,
        index=False,
    )

    print("\nTraining set shape:", train_df.shape)
    print("Testing set shape:", test_df.shape)

    print("\nTraining class distribution:")
    print(train_df["Class"].value_counts())

    print("\nTesting class distribution:")
    print(test_df["Class"].value_counts())

    print("\nProcessed data saved successfully.")
    print("No test-data leakage was used while fitting the scaler.")


if __name__ == "__main__":
    main()