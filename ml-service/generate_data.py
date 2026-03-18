import pandas as pd
import random

data = []

locations = ["Delhi", "Mumbai", "Bangalore", "Kolkata"]
devices = ["Android", "iOS", "Web"]

for i in range(15000):
    user_avg = random.randint(500, 50000)
    amount = random.randint(10, 60000)
    time = random.randint(0, 23)
    location = random.choice(locations)
    device = random.choice(devices)
    frequency = random.randint(1, 10)

    amount_ratio = amount / user_avg

    is_new_location = random.choice([0, 1])
    is_new_device = random.choice([0, 1])

    # Fraud logic (simulate real patterns)
    fraud = 1 if (
        amount_ratio > 10 or
        (is_new_location and amount_ratio > 5) or
        (is_new_device and time > 22)
    ) else 0

    data.append([
        amount, time, location, device, frequency,
        amount_ratio, is_new_location, is_new_device, fraud
    ])

df = pd.DataFrame(data, columns=[
    "amount", "time", "location", "device", "frequency",
    "amount_ratio", "is_new_location", "is_new_device", "is_fraud"
])

df.to_csv("fraud_data.csv", index=False)
print("✅ Dataset created")