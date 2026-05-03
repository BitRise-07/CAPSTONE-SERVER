from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "artifacts" / "fraud_random_forest.joblib"
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

app = Flask(__name__)


def load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


model_bundle = load_model()


def error_response(message, status_code=400, details=None):
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status_code


def normalize_payload(payload):
    if "features" in payload and isinstance(payload["features"], dict):
        return payload["features"]
    return payload


def build_feature_frame(payload):
    feature_payload = normalize_payload(payload)
    missing = [column for column in FEATURE_COLUMNS if column not in feature_payload]
    if missing:
        raise ValueError(f"Missing required feature(s): {', '.join(missing)}")

    row = {}
    for column in FEATURE_COLUMNS:
        try:
            row[column] = float(feature_payload[column])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Feature '{column}' must be numeric") from exc

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def build_batch_feature_frame(records):
    if not isinstance(records, list) or not records:
        raise ValueError("'transactions' must be a non-empty list")

    frames = [build_feature_frame(record) for record in records]
    return pd.concat(frames, ignore_index=True)


@app.get("/")
def root():
    return jsonify(
        {
            "service": "Financial Fraud Detection ML API",
            "model_loaded": model_bundle is not None,
            "endpoints": {
                "health": "GET /health",
                "model_info": "GET /model/info",
                "predict": "POST /predict",
                "batch_predict": "POST /predict/batch",
            },
        }
    )


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model_bundle is not None})


@app.get("/model/info")
def model_info():
    if model_bundle is None:
        return error_response(
            "Model artifact not found. Run 'python train.py' first.",
            status_code=503,
        )

    return jsonify(
        {
            "model_type": model_bundle.get("model_type"),
            "dataset": model_bundle.get("dataset"),
            "feature_columns": model_bundle.get("feature_columns"),
            "metrics": model_bundle.get("metrics"),
        }
    )


@app.post("/predict")
def predict():
    if model_bundle is None:
        return error_response(
            "Model artifact not found. Run 'python train.py' first.",
            status_code=503,
        )

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response("Request body must be a JSON object")

    try:
        features = build_feature_frame(payload)
    except ValueError as exc:
        return error_response(str(exc))

    model = model_bundle["pipeline"]
    fraud_probability = float(model.predict_proba(features)[0][1])
    prediction = int(fraud_probability >= model_bundle["threshold"])

    return jsonify(
        {
            "is_fraud": bool(prediction),
            "fraud_probability": fraud_probability,
            "threshold": model_bundle["threshold"],
        }
    )


@app.post("/predict/batch")
def predict_batch():
    if model_bundle is None:
        return error_response(
            "Model artifact not found. Run 'python train.py' first.",
            status_code=503,
        )

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response("Request body must be a JSON object")

    try:
        features = build_batch_feature_frame(payload.get("transactions"))
    except ValueError as exc:
        return error_response(str(exc))

    model = model_bundle["pipeline"]
    probabilities = model.predict_proba(features)[:, 1]
    predictions = probabilities >= model_bundle["threshold"]

    results = [
        {
            "index": index,
            "is_fraud": bool(prediction),
            "fraud_probability": float(probability),
        }
        for index, (prediction, probability) in enumerate(zip(predictions, probabilities))
    ]

    return jsonify({"threshold": model_bundle["threshold"], "results": results})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
