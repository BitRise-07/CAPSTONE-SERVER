# Financial Fraud Detection ML Backend

Flask backend for fraud detection using scikit-learn `RandomForestClassifier`.

The trainer starts from the Kaggle-style `creditcard.csv` fraud labels, then
generates synthetic behavioral features that match the Node rule engine:

```text
amount, hour_of_day, velocity_10m, velocity_1h, time_gap_minutes,
geo_distance_km, device_changed, amount_deviation, night_transaction,
known_device, known_location
```

This lets the rule engine and ML model evaluate the same transaction shape.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train.py
python app.py
```

The API runs at:

```text
http://127.0.0.1:5000
```

## Endpoints

```text
GET  /health
GET  /model/info
POST /predict
POST /predict/batch
```

## Test Single Prediction

You can send features directly:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/predict `
  -ContentType "application/json" `
  -Body '{
    "amount": 1250,
    "hour_of_day": 16,
    "velocity_10m": 5,
    "velocity_1h": 5,
    "time_gap_minutes": 0.05,
    "geo_distance_km": 0,
    "device_changed": 0,
    "amount_deviation": 0.17,
    "night_transaction": 0,
    "known_device": 1,
    "known_location": 1
  }'
```

Or send the same nested `features` object your Node transaction stores:

```json
{
  "features": {
    "amount": 1250,
    "hour_of_day": 16,
    "velocity_10m": 5,
    "velocity_1h": 5,
    "time_gap_minutes": 0.05,
    "geo_distance_km": 0,
    "device_changed": 0,
    "amount_deviation": 0.17,
    "night_transaction": 0,
    "known_device": 1,
    "known_location": 1
  }
}
```

Example response:

```json
{
  "fraud_probability": 0.42,
  "is_fraud": false,
  "threshold": 0.5
}
```

## Important Note

The original Kaggle dataset does not include real user, device, merchant, or
location history. The behavioral columns are synthetic so the ML model can be
integrated with the rule-engine feature format for a capstone/demo. In a real
system, retrain this model with confirmed fraud outcomes from your own
transactions.
