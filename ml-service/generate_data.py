import pandas as pd
import random

data = []

locations = ["Delhi", "Mumbai", "Bangalore", "Kolkata"]
devices = ["Android", "iOS", "Web"]

for i in range(10000):
    amount = random.randint(10, 50000)
    time = random.randint(0, 23)
    location = random.choice(locations)
    device = random.choice(devices)
    frequency = random.randint(1, 10)

    is_foreign = 1 if location not in ["Delhi", "Mumbai"] else 0
    is_high_amount = 1 if amount > 20000 else 0

    # Fraud logic (simulate real pattern)
    fraud = 1 if (
        is_foreign and is_high_amount and time > 22
    ) else 0

    data.append([
        amount, time, location, device, frequency,
        is_foreign, is_high_amount, fraud
    ])

df = pd.DataFrame(data, columns=[
    "amount", "time", "location", "device", "frequency",
    "is_foreign", "is_high_amount", "is_fraud"
])

df.to_csv("fraud_data.csv", index=False)
print("✅ Dataset created")