import pandas as pd
import sys
import os

def explore_data(df):
    print("Head of the DataFrame:")
    print(df.head(10))
    print("\nSummary Statistics:")
    print(df.describe())
    print("\nMissing Value Counts:")
    print(df.isnull().sum())
    print("\nData Types:")
    print(df.dtypes)

def clean_data(df):
    # Drop duplicate rows
    initial_shape = df.shape
    df = df.drop_duplicates()
    print(f"Dropped duplicates: {initial_shape[0] - df.shape[0]} rows removed.")

    # Fill or drop NA for numeric columns
    for col in df.select_dtypes(include=['float64', 'int64']).columns:
        if df[col].isnull().mean() > 0.1:  # More than 10% missing
            df = df.drop(col, axis=1)
            print(f"Dropped column '{col}' due to high missing values.")
        else:
            df[col].fillna(df[col].mean(), inplace=True)
            print(f"Filled missing values in column '{col}' with mean.")

    # Standardize column names
    df.columns = [col.lower().replace(' ', '_') for col in df.columns]
    print("Standardized column names.")

    # Convert date columns to datetime
    for col in df.select_dtypes(include=['object']).columns:
        try:
            df[col] = pd.to_datetime(df[col])
            print(f"Converted column '{col}' to datetime.")
        except (ValueError, TypeError):
            print(f"Column '{col}' could not be converted to datetime.")

    return df

def main(csv_path):
    if not os.path.exists(csv_path):
        print(f"File {csv_path} does not exist.")
        return

    df = pd.read_csv(csv_path)
    explore_data(df)

    cleaned_df = clean_data(df)

    cleaned_csv_path = f"./data/cleaned_{os.path.basename(csv_path)}"
    cleaned_df.to_csv(cleaned_csv_path, index=False)
    print(f"Cleaned data saved to {cleaned_csv_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python explore_and_clean_dataset.py <path_to_csv>")
    else:
        main(sys.argv[1])