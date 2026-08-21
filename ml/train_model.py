import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

df = pd.read_csv("vehicle_prices_synthetic.csv")

CATEGORICAL = ["make", "model", "category", "body_type", "transmission", "fuel_type", "engine", "location"]
NUMERIC = ["year", "mileage", "seats"]
TARGET = "sale_price"

X = df[CATEGORICAL + NUMERIC]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
], remainder="passthrough")

candidates = {
    "LinearRegression": LinearRegression(),
    "RandomForest": RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1),
    "HistGradientBoosting": HistGradientBoostingRegressor(max_depth=6, random_state=42),
}

results = []
best_name, best_pipe, best_mae = None, None, float("inf")

for name, model in candidates.items():
    pipe = Pipeline([("prep", preprocessor), ("model", model)])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    mape = np.mean(np.abs((y_test - preds) / y_test)) * 100

    results.append((name, mae, rmse, r2, mape))
    print(f"{name:22s} MAE={mae:>12,.0f}  RMSE={rmse:>12,.0f}  R2={r2:.4f}  MAPE={mape:.1f}%")

    if mae < best_mae:
        best_name, best_pipe, best_mae = name, pipe, mae

print(f"\nBest model: {best_name} (lowest MAE)")

joblib.dump(best_pipe, "price_model.joblib")
import os
print(f"Saved price_model.joblib ({os.path.getsize('price_model.joblib') / 1024:.1f} KB)")

# sanity check: a few real predictions vs actuals
sample = X_test.iloc[:5].copy()
sample["actual_price"] = y_test.iloc[:5].values
sample["predicted_price"] = best_pipe.predict(X_test.iloc[:5])
print("\nSample predictions:")
print(sample.to_string(index=False))
