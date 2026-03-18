import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# Load dataset
df = pd.read_csv("fraud_data.csv")

# Encoders
le_location = LabelEncoder()
le_last_location = LabelEncoder()
le_device = LabelEncoder()

df["location"] = le_location.fit_transform(df["location"])
df["last_location"] = le_last_location.fit_transform(df["last_location"])
df["device"] = le_device.fit_transform(df["device"])

# Split
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Model
model = RandomForestClassifier(n_estimators=150)
model.fit(X_train, y_train)

# Evaluation
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save everything
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(le_location, open("le_location.pkl", "wb"))
pickle.dump(le_last_location, open("le_last_location.pkl", "wb"))
pickle.dump(le_device, open("le_device.pkl", "wb"))

print("✅ Updated model trained & saved")