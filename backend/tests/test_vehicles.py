VEHICLE_PAYLOAD = {
    "title": "Test Sedan", "make": "Toyota", "model": "Corolla", "year": 2020,
    "category": "Sedan", "location": "Lahore", "rental_price": 5000,
    "transmission": "Automatic", "fuel_type": "Petrol",
}


def test_create_vehicle_requires_admin(client, register_user):
    _, headers = register_user()
    res = client.post("/vehicles", json=VEHICLE_PAYLOAD, headers=headers)
    assert res.status_code == 403


def test_create_vehicle_requires_auth(client):
    res = client.post("/vehicles", json=VEHICLE_PAYLOAD)
    assert res.status_code in (401, 403)


def test_admin_can_create_vehicle_defaults_to_pending(client, register_admin):
    _, headers = register_admin()
    res = client.post("/vehicles", json=VEHICLE_PAYLOAD, headers=headers)
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "PENDING"


def test_pending_vehicle_not_in_public_listing(client, register_admin):
    _, headers = register_admin()
    client.post("/vehicles", json=VEHICLE_PAYLOAD, headers=headers)
    res = client.get("/vehicles")
    assert res.status_code == 200
    assert res.json() == []  # PENDING vehicles are hidden from the public list


def test_approved_vehicle_appears_in_public_listing(client, make_vehicle):
    vehicle = make_vehicle()
    res = client.get("/vehicles")
    assert res.status_code == 200
    ids = [v["id"] for v in res.json()]
    assert vehicle["id"] in ids


def test_vehicle_not_found_returns_404(client):
    res = client.get("/vehicles/999999")
    assert res.status_code == 404


def test_non_admin_cannot_change_vehicle_status(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, user_headers = register_user()
    res = client.put(f"/vehicles/{vehicle['id']}", json={"status": "REJECTED"}, headers=user_headers)
    assert res.status_code == 403


def test_delete_vehicle_with_no_bookings_succeeds(client, register_admin, make_vehicle):
    _, admin_headers = register_admin()
    vehicle = make_vehicle()
    res = client.delete(f"/vehicles/{vehicle['id']}", headers=admin_headers)
    assert res.status_code == 204
    assert client.get(f"/vehicles/{vehicle['id']}").status_code == 404


def test_delete_vehicle_blocked_when_bookings_exist(client, register_admin, register_user, make_vehicle):
    _, admin_headers = register_admin()
    vehicle = make_vehicle()
    _, user_headers = register_user()

    booking = client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=user_headers)
    assert booking.status_code == 201, booking.text

    res = client.delete(f"/vehicles/{vehicle['id']}", headers=admin_headers)
    assert res.status_code == 409
    assert "booking" in res.json()["detail"].lower()
    # and the vehicle must still actually exist
    assert client.get(f"/vehicles/{vehicle['id']}").status_code == 200


def test_delete_vehicle_cleans_up_favorites_and_reviews(client, register_admin, register_user, make_vehicle):
    _, admin_headers = register_admin()
    vehicle = make_vehicle()
    _, user_headers = register_user()

    fav = client.post(f"/favorites/{vehicle['id']}", headers=user_headers)
    assert fav.status_code in (200, 201), fav.text
    review = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 5, "comment": "Great!"}, headers=user_headers)
    assert review.status_code == 201, review.text

    res = client.delete(f"/vehicles/{vehicle['id']}", headers=admin_headers)
    assert res.status_code == 204, res.text  # would 500 pre-fix due to the FK constraint


def test_delete_nonexistent_vehicle_returns_404(client, register_admin):
    _, headers = register_admin()
    res = client.delete("/vehicles/999999", headers=headers)
    assert res.status_code == 404

def test_admin_cannot_set_invalid_vehicle_status(client, register_admin, make_vehicle):
    vehicle = make_vehicle()
    _, admin_headers = register_admin()
    res = client.put(f"/vehicles/{vehicle['id']}", json={"status": "DELETED"}, headers=admin_headers)
    assert res.status_code == 422