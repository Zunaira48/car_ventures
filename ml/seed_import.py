"""
Imports the prepared seed_vehicles.csv into car_ventures via the real API
(not a direct DB write) - this reuses all existing validation exactly as if
an admin created each listing by hand, then approves each one.

Run from the ml/ folder: python seed_import.py
Requires: requests  (pip install requests)
"""
import getpass
import sys

import pandas as pd
import requests

API_BASE = "http://127.0.0.1:8000"

IMAGE_MAP = {
    "Sedan": "/images/sedan.jpg",
    "Hatchback": "/images/hatchback.jpg",
    "Economy": "/images/economy.jpg",
    "SUV": "/images/suv.jpg",
    "Luxury": "/images/luxury.jpg",
    "Hybrid": "/images/hybrid.jpg",
    "Pickup": "/images/pickup.jpg",
}


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
        payload["images"] = [IMAGE_MAP.get(row["category"], "/images/sedan.jpg")]

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
