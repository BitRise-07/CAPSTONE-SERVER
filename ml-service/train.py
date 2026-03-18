import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# Load dataset
df = pd.read_csv("fraud_data.csv")

# Encode categorical features
le_location = LabelEncoder()
le_device = LabelEncoder()

df["location"] = le_location.fit_transform(df["location"])
df["device"] = le_device.fit_transform(df["device"])

# Split features and target
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save model & encoders
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(le_location, open("le_location.pkl", "wb"))
pickle.dump(le_device, open("le_device.pkl", "wb"))

print("✅ Model trained & saved")