import pandas as pd
import random

data = []

locations = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Chandigarh"]
devices = ["Android", "iOS", "Web"]

def random_distance():
    return random.uniform(0, 2000)  # km

for i in range(20000):
    user_avg = random.randint(500, 50000)
    amount = random.randint(10, 80000)
    time = random.randint(0, 23)
    
    location = random.choice(locations)
    last_location = random.choice(locations)

    device = random.choice(devices)

    frequency = random.randint(1, 15)
    failed_txn = random.randint(0, 5)

    amount_ratio = amount / user_avg

    is_new_location = 1 if location != last_location else 0
    is_new_device = random.choice([0, 1])
    is_new_receiver = random.choice([0, 1])

    distance = random_distance()
    time_diff_hours = random.uniform(0.1, 5)
    speed = distance / time_diff_hours

    # 🔥 Fraud Logic (more realistic)
    fraud = 1 if (
        amount_ratio > 8 or
        (is_new_location and speed > 500) or
        (is_new_device and amount > 30000) or
        (failed_txn > 3) or
        (is_new_receiver and amount > 40000)
    ) else 0

    data.append([
        amount,
        user_avg,
        amount_ratio,
        time,
        frequency,
        failed_txn,
        location,
        last_location,
        distance,
        speed,
        device,
        is_new_location,
        is_new_device,
        is_new_receiver,
        fraud
    ])

df = pd.DataFrame(data, columns=[
    "amount",
    "user_avg_amount",
    "amount_ratio",
    "time",
    "transaction_count_today",
    "failed_txn_count",
    "location",
    "last_location",
    "distance_km",
    "speed_kmph",
    "device",
    "is_new_location",
    "is_new_device",
    "is_new_receiver",
    "is_fraud"
])

df.to_csv("fraud_data.csv", index=False)
print("✅ Updated dataset created")