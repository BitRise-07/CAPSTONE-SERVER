from pathlib import Path
from urllib.request import urlretrieve

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
DATA_PATH = DATA_DIR / "creditcard.csv"
ENHANCED_DATA_PATH = DATA_DIR / "enhanced_fraud_features.csv"
MODEL_PATH = ARTIFACTS_DIR / "fraud_random_forest.joblib"
DATASET_URL = "https://storage.googleapis.com/download.tensorflow.org/data/creditcard.csv"

FEATURE_COLUMNS = [
    "amount",
    "hour_of_day",
    "velocity_10m",
    "velocity_1h",
    "time_gap_minutes",
    "geo_distance_km",
    "device_changed",
    "amount_deviation",
    "night_transaction",
    "known_device",
    "known_location",
]
TARGET_COLUMN = "is_fraud"


def ensure_dataset():
    DATA_DIR.mkdir(exist_ok=True)
    if DATA_PATH.exists():
        return

    print("Downloading credit card fraud dataset mirror...")
    print(f"Source: {DATASET_URL}")
    urlretrieve(DATASET_URL, DATA_PATH)


def add_synthetic_behavior_features(df):
    rng = np.random.default_rng(42)
    fraud = df["Class"].astype(int).to_numpy()
    is_fraud = fraud == 1

    amount = df["Amount"].fillna(0).clip(lower=0).to_numpy()
    hour = ((df["Time"].fillna(0).to_numpy() // 3600) % 24).astype(int)

    velocity_10m = np.where(
        is_fraud,
        rng.poisson(lam=3.5, size=len(df)),
        rng.poisson(lam=0.5, size=len(df)),
    )
    velocity_10m = np.clip(velocity_10m, 0, 12)

    velocity_1h = velocity_10m + np.where(
        is_fraud,
        rng.poisson(lam=4.0, size=len(df)),
        rng.poisson(lam=1.5, size=len(df)),
    )
    velocity_1h = np.clip(velocity_1h, 0, 30)

    time_gap_minutes = np.where(
        is_fraud,
        rng.exponential(scale=8, size=len(df)),
        rng.exponential(scale=180, size=len(df)),
    )
    time_gap_minutes = np.clip(time_gap_minutes, 0.01, 9999)

    geo_distance_km = np.where(
        is_fraud,
        rng.exponential(scale=350, size=len(df)),
        rng.exponential(scale=25, size=len(df)),
    )
    geo_distance_km = np.clip(geo_distance_km, 0, 5000)

    device_changed = np.where(
        is_fraud,
        rng.binomial(1, 0.45, size=len(df)),
        rng.binomial(1, 0.04, size=len(df)),
    )

    amount_std = float(np.std(amount)) or 1.0
    amount_median = float(np.median(amount))
    amount_z = np.abs(amount - amount_median) / amount_std
    amount_deviation = amount_z + np.where(
        is_fraud,
        rng.exponential(scale=2.4, size=len(df)),
        rng.exponential(scale=0.35, size=len(df)),
    )
    amount_deviation = np.clip(amount_deviation, 0, 20)

    night_transaction = ((hour < 6) | (hour > 22)).astype(int)

    known_device = np.where(
        device_changed == 1,
        0,
        np.where(
            is_fraud,
            rng.binomial(1, 0.55, size=len(df)),
            rng.binomial(1, 0.98, size=len(df)),
        ),
    )

    known_location = np.where(
        geo_distance_km > 100,
        0,
        np.where(
            is_fraud,
            rng.binomial(1, 0.45, size=len(df)),
            rng.binomial(1, 0.96, size=len(df)),
        ),
    )

    enhanced = pd.DataFrame(
        {
            "amount": amount,
            "hour_of_day": hour,
            "velocity_10m": velocity_10m,
            "velocity_1h": velocity_1h,
            "time_gap_minutes": np.round(time_gap_minutes, 2),
            "geo_distance_km": np.round(geo_distance_km, 2),
            "device_changed": device_changed,
            "amount_deviation": np.round(amount_deviation, 3),
            "night_transaction": night_transaction,
            "known_device": known_device,
            "known_location": known_location,
            TARGET_COLUMN: fraud,
        }
    )

    return enhanced


def train():
    ensure_dataset()
    ARTIFACTS_DIR.mkdir(exist_ok=True)

    raw_df = pd.read_csv(DATA_PATH)
    missing_columns = [column for column in ["Time", "Amount", "Class"] if column not in raw_df.columns]
    if missing_columns:
        raise ValueError(f"Dataset missing columns: {', '.join(missing_columns)}")

    enhanced_df = add_synthetic_behavior_features(raw_df)
    enhanced_dataset_saved = True
    try:
        enhanced_df.to_csv(ENHANCED_DATA_PATH, index=False)
    except PermissionError:
        enhanced_dataset_saved = False
        print(
            "Warning: could not overwrite enhanced_fraud_features.csv. "
            "Close the file if it is open in Excel/VS Code. Continuing model training..."
        )

    X = enhanced_df[FEATURE_COLUMNS]
    y = enhanced_df[TARGET_COLUMN].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "scale_continuous",
                StandardScaler(),
                [
                    "amount",
                    "hour_of_day",
                    "velocity_10m",
                    "velocity_1h",
                    "time_gap_minutes",
                    "geo_distance_km",
                    "amount_deviation",
                ],
            )
        ],
        remainder="passthrough",
    )

    pipeline = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=150,
                    max_depth=10,
                    min_samples_leaf=3,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    print("Training Random Forest on engineered behavioral fraud features...")
    pipeline.fit(X_train, y_train)

    probabilities = pipeline.predict_proba(X_test)[:, 1]
    threshold = 0.5
    predictions = (probabilities >= threshold).astype(int)

    metrics = {
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "classification_report": classification_report(
            y_test,
            predictions,
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "test_rows": int(len(X_test)),
        "fraud_rate": float(y.mean()),
    }

    bundle = {
        "pipeline": pipeline,
        "model_type": "RandomForestClassifier",
        "dataset": {
            "name": "Credit Card Fraud Detection with Synthetic Behavioral Features",
            "format": "Kaggle creditcard.csv labels + engineered rule-engine-style features",
            "source_url": DATASET_URL,
            "raw_rows": int(len(raw_df)),
            "enhanced_dataset_path": str(ENHANCED_DATA_PATH) if enhanced_dataset_saved else None,
            "note": (
                "Behavioral columns are synthetic because Kaggle hides user, device, "
                "merchant, and location data."
            ),
        },
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "threshold": threshold,
        "metrics": metrics,
    }

    joblib.dump(bundle, MODEL_PATH)

    if enhanced_dataset_saved:
        print(f"Saved enhanced dataset to {ENHANCED_DATA_PATH}")
    else:
        print("Skipped enhanced dataset CSV export because the file was locked.")
    print(f"Saved model to {MODEL_PATH}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"Confusion matrix: {metrics['confusion_matrix']}")


if __name__ == "__main__":
    train()
