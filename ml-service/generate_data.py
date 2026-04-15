import pandas as pd
import random

data = []

locations = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai", "Hyderabad"]
devices = ["Android", "iOS", "Web"]

for i in range(10000):
    amount = random.randint(10, 70000)
    time = random.randint(0, 23)
    location = random.choice(locations)
    device = random.choice(devices)
    frequency = random.randint(1, 15)

    is_foreign = 1 if location not in ["Delhi", "Mumbai"] else 0
    is_high_amount = 1 if amount > 25000 else 0
    is_night = 1 if time >= 23 or time <= 4 else 0

    # More realistic fraud logic
    fraud = 1 if (
        (is_foreign and is_high_amount) or
        (is_night and frequency > 8) or
        (device == "Web" and amount > 30000)
    ) else 0

    data.append([
        amount, time, location, device, frequency,
        is_foreign, is_high_amount, is_night, fraud
    ])

df = pd.DataFrame(data, columns=[
    "amount", "time", "location", "device", "frequency",
    "is_foreign", "is_high_amount", "is_night", "is_fraud"
])

df.to_csv("fraud_data.csv", index=False)
print("✅ Improved dataset created")