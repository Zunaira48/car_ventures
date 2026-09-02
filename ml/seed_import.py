"""
Imports the prepared seed_vehicles.csv into car_ventures via the real API
(not a direct DB write) - this reuses all existing validation exactly as if
an admin created each listing by hand, then approves each one.

Run from the ml/ folder: python seed_import.py
Requires: requests  (pip install requests)
"""
import getpass
import os
import sys
from collections import defaultdict

import pandas as pd
import requests

# Override without editing this file: $env:API_BASE="https://your-render-url.onrender.com" (PowerShell)
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")

# Multiple photos per category, round-robin assigned, so vehicles sharing a
# category no longer all get the exact same image. Sedan/Hatchback/Economy get
# 2 distinct photos each (the highest-volume categories); the rest stay at 1.
# The first filename in each list is the photo that already exists in
# frontend/public/images/ today - only the "-2" files need to be newly sourced.
IMAGE_VARIANTS = {
    "Sedan": ["sedan.jpg", "sedan-2.jpg"],
    "Hatchback": ["hatchback.jpg", "hatchback-2.jpg"],
    "Economy": ["economy.jpg", "economy-2.jpg"],
    "SUV": ["suv.jpg"],
    "Luxury": ["luxury.jpg"],
    "Hybrid": ["hybrid.jpg"],
    "Pickup": ["pickup.jpg"],
}

_category_counters = defaultdict(int)


def next_image(category: str) -> str:
    """Round-robins through that category's photo pool, wrapping around."""
    variants = IMAGE_VARIANTS.get(category, IMAGE_VARIANTS["Sedan"])
    idx = _category_counters[category] % len(variants)
    _category_counters[category] += 1
    return f"/images/{variants[idx]}"


def login(email, password):
    res = requests.post(f"{API_BASE}/auth/login", json={"email": email, "password": password})
    res.raise_for_status()
    return res.json()["access_token"]


def main():
    email = input("Admin email: ").strip()
    password = getpass.getpass("Admin password: ")

    print("Logging in...")
    try:
        token = login(email, password)
    except requests.HTTPError as e:
        print(f"Login failed: {e.response.status_code} {e.response.text}")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    df = pd.read_csv("seed_vehicles.csv")

    created, approved, failed = 0, 0, []

    for _, row in df.iterrows():
        payload = row.to_dict()
        payload["images"] = [next_image(row["category"])]

        try:
            res = requests.post(f"{API_BASE}/vehicles", json=payload, headers=headers)
            res.raise_for_status()
            vehicle_id = res.json()["id"]
            created += 1

            res2 = requests.put(f"{API_BASE}/vehicles/{vehicle_id}", json={"status": "APPROVED"}, headers=headers)
            res2.raise_for_status()
            approved += 1
            print(f"  [{vehicle_id}] {row['title']} - created and approved")

        except requests.HTTPError as e:
            failed.append((row["title"], e.response.status_code, e.response.text))
            print(f"  FAILED: {row['title']} -> {e.response.status_code} {e.response.text}")

    print(f"\nDone. Created: {created}, Approved: {approved}, Failed: {len(failed)}")
    if failed:
        print("\nFailures:")
        for title, code, detail in failed:
            print(f"  - {title}: {code} {detail}")


if __name__ == "__main__":
    main()