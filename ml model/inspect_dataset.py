import pandas as pd


DATASET_PATH = "data/raw/creditcard.csv"


def main():
    df = pd.read_csv(DATASET_PATH)

    print("\n=== DATASET SHAPE ===")
    print(df.shape)

    print("\n=== COLUMN NAMES ===")
    print(df.columns.tolist())

    print("\n=== FIRST 5 ROWS ===")
    print(df.head())

    print("\n=== MISSING VALUES ===")
    print(df.isnull().sum())

    print("\n=== CLASS DISTRIBUTION ===")
    print(df["Class"].value_counts())

    print("\n=== CLASS PERCENTAGES ===")
    print(df["Class"].value_counts(normalize=True) * 100)


if __name__ == "__main__":
    main()