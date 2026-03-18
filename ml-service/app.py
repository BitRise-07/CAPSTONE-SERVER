from fastapi import FastAPI
import pickle
import numpy as np

app = FastAPI()

# Load model & encoders
model = pickle.load(open("model.pkl", "rb"))
le_location = pickle.load(open("le_location.pkl", "rb"))
le_device = pickle.load(open("le_device.pkl", "rb"))

@app.post("/predict")
def predict(data: dict):
    try:
        amount = data["amount"]
        time = data["time"]
        location = le_location.transform([data["location"]])[0]
        device = le_device.transform([data["device"]])[0]
        frequency = data["frequency"]

        user_avg = data["user_avg_amount"]
        user_locations = data["user_locations"]
        user_devices = data["user_devices"]

        # Behavioral features (for ML)
        amount_ratio = amount / user_avg if user_avg > 0 else 1
        is_new_location = 1 if data["location"] not in user_locations else 0
        is_new_device = 1 if data["device"] not in user_devices else 0

        features = np.array([
            amount, time, location, device,
            frequency, amount_ratio,
            is_new_location, is_new_device
        ]).reshape(1, -1)

        # Only ML prediction
        fraud_prob = model.predict_proba(features)[0][1]

        return {
            "fraud_probability": float(fraud_prob)
        }

    except Exception as e:
        return {"error": str(e)}