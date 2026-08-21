"""
SYNTHETIC DATASET GENERATOR - car_ventures AI price prediction

This dataset is entirely synthetic / rule-based. It is NOT scraped, NOT sourced
from any real listings site, and does NOT represent real transactions. It exists
because no suitable licensed Pakistan-specific used-vehicle price dataset was
available for this portfolio project (see README/docs/ai.md for the writeup).

Generation approach: each (make, model) has a realistic "near-new" base price for
the Pakistani market (rough 2025/2026 estimates, not sourced from any single
site), then price is adjusted by age-based depreciation, mileage relative to
expected mileage-for-age, transmission, fuel type, city, and random noise to
simulate real-world seller/condition variance.

Run: python3 generate_dataset.py
Output: vehicle_prices_synthetic.csv
"""
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
CURRENT_YEAR = 2026
N_ROWS = 4000

# (make, model, category, body_type, seats, base_price_pkr, engine_options, fuel_options, min_year)
CATALOG = [
    ("Suzuki", "Mehran", "Economy", "Hatchback", 4, 1_600_000, ["800cc"], ["Petrol"], 2005),
    ("Suzuki", "Alto", "Economy", "Hatchback", 4, 2_400_000, ["660cc", "1.0L"], ["Petrol"], 2012),
    ("Suzuki", "Cultus", "Hatchback", "Hatchback", 5, 3_100_000, ["1.0L"], ["Petrol"], 2010),
    ("Suzuki", "Wagon R", "Hatchback", "Hatchback", 5, 2_900_000, ["1.0L"], ["Petrol"], 2014),
    ("Suzuki", "Swift", "Hatchback", "Hatchback", 5, 4_100_000, ["1.3L"], ["Petrol"], 2010),
    ("Suzuki", "Bolan", "Economy", "Van", 8, 2_200_000, ["800cc"], ["Petrol"], 2005),
    ("Suzuki", "APV", "Van", "Van", 8, 4_600_000, ["1.5L"], ["Petrol"], 2008),
    ("Toyota", "Corolla", "Sedan", "Sedan", 5, 6_500_000, ["1.3L", "1.6L", "1.8L"], ["Petrol"], 2008),
    ("Toyota", "Yaris", "Sedan", "Sedan", 5, 5_000_000, ["1.3L", "1.5L"], ["Petrol"], 2020),
    ("Toyota", "Prius", "Hybrid", "Hatchback", 5, 6_000_000, ["1.8L Hybrid"], ["Hybrid"], 2010),
    ("Toyota", "Fortuner", "SUV", "SUV", 7, 15_000_000, ["2.7L", "2.8L"], ["Petrol", "Diesel"], 2012),
    ("Toyota", "Hilux", "Pickup", "Pickup", 5, 9_500_000, ["2.4L", "2.8L"], ["Diesel"], 2010),
    ("Toyota", "Land Cruiser", "Luxury", "SUV", 7, 35_000_000, ["3.5L", "4.6L"], ["Petrol"], 2012),
    ("Honda", "City", "Sedan", "Sedan", 5, 5_500_000, ["1.2L", "1.5L"], ["Petrol"], 2010),
    ("Honda", "Civic", "Sedan", "Sedan", 5, 8_500_000, ["1.5L Turbo", "1.8L"], ["Petrol"], 2012),
    ("Honda", "BR-V", "Family", "SUV", 7, 6_500_000, ["1.5L"], ["Petrol"], 2017),
    ("Honda", "Vezel", "Hybrid", "SUV", 5, 8_000_000, ["1.5L Hybrid"], ["Hybrid"], 2014),
    ("KIA", "Sportage", "SUV", "SUV", 5, 8_500_000, ["2.0L"], ["Petrol"], 2019),
    ("Hyundai", "Tucson", "SUV", "SUV", 5, 9_500_000, ["2.0L"], ["Petrol"], 2020),
    ("Daihatsu", "Mira", "Economy", "Hatchback", 4, 2_500_000, ["660cc"], ["Petrol"], 2010),
]

CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"]
CITY_FACTOR = {
    "Lahore": 1.03, "Karachi": 1.03, "Islamabad": 1.02, "Rawalpindi": 1.0,
    "Faisalabad": 0.99, "Multan": 0.98, "Peshawar": 0.97, "Quetta": 0.96,
}

rows = []
for _ in range(N_ROWS):
    make, model, category, body_type, seats, base_price, engines, fuels, min_year = CATALOG[
        rng.integers(0, len(CATALOG))
    ]
    year = int(rng.integers(min_year, CURRENT_YEAR + 1))
    age = CURRENT_YEAR - year

    engine = engines[rng.integers(0, len(engines))]
    fuel_type = fuels[rng.integers(0, len(fuels))]
    transmission = "Automatic" if rng.random() < 0.55 else "Manual"
    city = CITIES[rng.integers(0, len(CITIES))]

    expected_mileage = age * rng.normal(12000, 1500)
    expected_mileage = max(expected_mileage, 0)
    mileage = max(0, int(rng.normal(expected_mileage, 8000)))

    # --- price formula (documented, rule-based) ---
    depreciation = base_price * (0.88 ** age)
    depreciation = max(depreciation, base_price * 0.15)  # residual value floor

    mileage_diff = mileage - expected_mileage
    mileage_factor = 1 - np.clip(mileage_diff / 200_000, -0.15, 0.25)

    transmission_factor = 1.06 if transmission == "Automatic" else 1.0
    fuel_factor = {"Hybrid": 1.08, "Diesel": 1.02, "Petrol": 1.0, "Electric": 1.05}.get(fuel_type, 1.0)
    city_factor = CITY_FACTOR[city]
    noise = np.clip(rng.normal(1.0, 0.06), 0.85, 1.15)

    price = depreciation * mileage_factor * transmission_factor * fuel_factor * city_factor * noise
    price = round(price / 5000) * 5000  # round to nearest 5,000 PKR, like real listings

    rows.append({
        "make": make, "model": model, "year": year, "category": category,
        "body_type": body_type, "transmission": transmission, "fuel_type": fuel_type,
        "engine": engine, "mileage": mileage, "seats": seats, "location": city,
        "sale_price": price,
    })

df = pd.DataFrame(rows)
df.to_csv("vehicle_prices_synthetic.csv", index=False)
print(f"Wrote {len(df)} rows to vehicle_prices_synthetic.csv")
print(df.describe(include="all").T[["count", "unique", "top", "freq"]].to_string())
print("\nPrice stats (PKR):")
print(df["sale_price"].describe().to_string())
