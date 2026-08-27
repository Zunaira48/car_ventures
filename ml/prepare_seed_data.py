"""
Seed-data preparation script for car_ventures.

Source: 'Used car prices in Pakistan 2021' (Kaggle, CC0: Public Domain)
https://www.kaggle.com/datasets/mustafaimam/used-car-prices-in-pakistan-2021

This script samples ~40 realistic rows from the real dataset (make/model/year/
price/mileage/city/transmission are REAL aggregate market data). Fields the
source dataset does not include (category, body_type, fuel_type, seats,
color, rental_price) are filled in using a documented, rule-based lookup -
NOT scraped, NOT guessed per-row. This is demo/seed inventory, not live
real-world listings - labeled as such in vehicle descriptions.
"""
import random

import pandas as pd

random.seed(7)

df = pd.read_csv("archive1/Used_car_prices_in_Pakistan_cleaned.csv")

# Keep it to vehicles that make sense for a demo rental/sale fleet, with a real registered city
df = df[
    (df["Make_Year"] >= 2010)
    & (df["Price"].between(800_000, 30_000_000))
    & (df["Registered City"] != "Un-Registered")
]

# --- Rule-based lookups (documented, not scraped) ---
CATEGORY_MAP = {
    "Corolla": ("Sedan", "Sedan"), "Civic": ("Sedan", "Sedan"), "City": ("Sedan", "Sedan"),
    "Grande": ("Sedan", "Sedan"), "Fielder": ("Sedan", "Sedan"),
    "Mehran": ("Economy", "Hatchback"), "Alto": ("Economy", "Hatchback"), "Cuore": ("Economy", "Hatchback"),
    "Cultus": ("Hatchback", "Hatchback"), "Vitz": ("Hatchback", "Hatchback"), "Wagon": ("Hatchback", "Hatchback"),
    "Swift": ("Hatchback", "Hatchback"), "Passo": ("Hatchback", "Hatchback"), "Mira": ("Economy", "Hatchback"),
    "Bolan": ("Economy", "Van"), "Ravi": ("Economy", "Pickup"),
    "Vezel": ("Hybrid", "SUV"), "Aqua": ("Hybrid", "Hatchback"), "Prius": ("Hybrid", "Hatchback"),
    "Prado": ("Luxury", "SUV"), "Land": ("Luxury", "SUV"), "Sportage": ("SUV", "SUV"),
    "Hilux": ("Pickup", "Pickup"), "Benz": ("Luxury", "Sedan"),
}
DEFAULT_CATEGORY = ("Sedan", "Sedan")

DIESEL_MODELS = {"Hilux", "Land", "Prado"}
HYBRID_MODELS = {"Vezel", "Aqua", "Prius"}

COLORS = ["White", "White", "Silver", "Black", "Grey", "Blue", "Red"]  # White weighted higher (most common in PK)


def lookup_category(model):
    for key, val in CATEGORY_MAP.items():
        if key.lower() in str(model).lower():
            return val
    return None  # unrecognized model - excluded from sampling below, not guessed


def lookup_fuel(model):
    if any(k.lower() in str(model).lower() for k in DIESEL_MODELS):
        return "Diesel"
    if any(k.lower() in str(model).lower() for k in HYBRID_MODELS):
        return "Hybrid"
    return "Petrol"


def format_engine(cc):
    cc = int(cc)
    if cc < 1000:
        return f"{cc}cc"
    return f"{cc / 1000:.1f}L"


def seats_for(category):
    return {"SUV": 7, "Van": 8, "Pickup": 5}.get(category, 5)


# Stratified sample: aim for a mix across categories, not 40 Corollas
# Only keep rows where we have genuine, confident category knowledge - no guessing on unrecognized models
df["category_tmp"] = df["Model"].apply(lambda m: lookup_category(m))
df = df[df["category_tmp"].notna()]
df["category_tmp"] = df["category_tmp"].apply(lambda t: t[0])
target_per_category = {"Sedan": 10, "Hatchback": 9, "Economy": 8, "SUV": 6, "Luxury": 4, "Hybrid": 2, "Pickup": 1}

rows = []
for cat, n in target_per_category.items():
    pool = df[df["category_tmp"] == cat]
    n = min(n, len(pool))
    rows.append(pool.sample(n=n, random_state=7))

sample = pd.concat(rows).sample(frac=1, random_state=7).reset_index(drop=True)  # shuffle

vehicles = []
for _, row in sample.iterrows():
    category, body_type = CATEGORY_MAP[next(k for k in CATEGORY_MAP if k.lower() in str(row["Model"]).lower())]
    fuel_type = lookup_fuel(row["Model"])
    sale_price = float(row["Price"])
    vehicles.append({
        "title": f"{int(row['Make_Year'])} {row['Make']} {row['Model']} {row['Version']}".strip(),
        "make": row["Make"],
        "model": row["Model"],
        "year": int(row["Make_Year"]),
        "category": category,
        "body_type": body_type,
        "transmission": row["Transmission"],
        "fuel_type": fuel_type,
        "engine": format_engine(row["CC"]),
        "mileage": int(row["Mileage"]),
        "seats": seats_for(category),
        "color": random.choice(COLORS),
        "location": row["Registered City"],
        "rental_price": round(sale_price / 1150, -2),
        "sale_price": sale_price,
        "description": (
            f"{row['Assembly']} assembly, {int(row['Mileage']):,} km driven, {row['Transmission']} transmission. "
            f"Demo listing generated from aggregated Pakistan used-car market data "
            f"(Kaggle, CC0: Public Domain) - not a live real-world listing."
        ),
    })

out = pd.DataFrame(vehicles)
out.to_csv("seed_vehicles.csv", index=False)
print(f"Prepared {len(out)} vehicles")
print("\nCategory mix:")
print(out["category"].value_counts())
print("\nSample rows:")
print(out[["title", "category", "fuel_type", "rental_price", "sale_price", "location"]].head(10).to_string())
