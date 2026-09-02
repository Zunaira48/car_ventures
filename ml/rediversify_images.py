"""
Re-diversifies images on vehicles that were already imported before the
round-robin fix in seed_import.py existed - without this, everything already
in the database keeps pointing at the single old image per category.

Run from the ml/ folder: python rediversify_images.py
Requires: requests  (pip install requests)

Safe to run against either your local dev API or the deployed production API -
just change API_BASE below. It only ever touches the `images` field via the
existing PUT /vehicles/{id} endpoint (the same one the admin UI uses), so
everything still goes through normal validation.
"""
import getpass
import os
import sys

import requests

from seed_import import IMAGE_VARIANTS, next_image, login  # noqa: F401

# Override without editing this file: $env:API_BASE="https://your-render-url.onrender.com" (PowerShell)
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")


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

    res = requests.get(f"{API_BASE}/admin/vehicles", headers=headers)
    res.raise_for_status()
    vehicles = res.json()

    updated, failed = 0, []

    for v in vehicles:
        new_image = next_image(v["category"])
        try:
            res2 = requests.put(
                f"{API_BASE}/vehicles/{v['id']}", json={"images": [new_image]}, headers=headers
            )
            res2.raise_for_status()
            updated += 1
            print(f"  [{v['id']}] {v['title']} ({v['category']}) -> {new_image}")
        except requests.HTTPError as e:
            failed.append((v["title"], e.response.status_code, e.response.text))
            print(f"  FAILED: {v['title']} -> {e.response.status_code} {e.response.text}")

    print(f"\nDone. Updated: {updated}, Failed: {len(failed)}")
    if failed:
        print("\nFailures:")
        for title, code, detail in failed:
            print(f"  - {title}: {code} {detail}")


if __name__ == "__main__":
    main()