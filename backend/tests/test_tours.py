def test_create_tour_requires_admin(client, register_user):
    _, headers = register_user()
    res = client.post("/tours", json={
        "tour_type": "GROUP_BUS", "title": "X", "destination": "Y", "price": 1000,
    }, headers=headers)
    assert res.status_code == 403


def test_create_tour_invalid_type_rejected(client, register_admin):
    _, headers = register_admin()
    res = client.post("/tours", json={
        "tour_type": "HOT_AIR_BALLOON", "title": "X", "destination": "Y", "price": 1000,
    }, headers=headers)
    assert res.status_code == 422


def test_tour_is_active_immediately_and_publicly_listed(client, make_tour):
    tour = make_tour()
    assert tour["status"] == "ACTIVE"
    listing = client.get("/tours")
    ids = [t["id"] for t in listing.json()]
    assert tour["id"] in ids


def test_inactive_tour_hidden_from_public_listing(client, register_admin, make_tour):
    _, headers = register_admin()
    tour = make_tour()
    client.put(f"/tours/{tour['id']}", json={"status": "INACTIVE"}, headers=headers)
    listing = client.get("/tours")
    ids = [t["id"] for t in listing.json()]
    assert tour["id"] not in ids


# ---------- GROUP_BUS: per-date seat capacity ----------

def test_group_bus_booking_within_capacity_succeeds(client, register_user, make_tour):
    tour = make_tour(max_group_size=20)
    _, headers = register_user()
    res = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 15,
    }, headers=headers)
    assert res.status_code == 201, res.text
    assert res.json()["total_price"] == 15 * tour["price"]


def test_group_bus_booking_exceeding_capacity_rejected(client, register_user, make_tour):
    tour = make_tour(max_group_size=20)
    _, headers_a = register_user(email="a@example.com")
    _, headers_b = register_user(email="b@example.com")

    first = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 15,
    }, headers=headers_a)
    assert first.status_code == 201

    second = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 10,
    }, headers=headers_b)
    assert second.status_code == 409
    assert "5 seat" in second.json()["detail"]  # only 5 remain (20 - 15)


def test_group_bus_capacity_is_per_departure_date(client, register_user, make_tour):
    tour = make_tour(max_group_size=20)
    _, headers = register_user()
    same_day = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 15,
    }, headers=headers)
    assert same_day.status_code == 201

    different_day = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-08", "num_people": 15,
    }, headers=headers)
    assert different_day.status_code == 201  # separate departure date, capacity resets


def test_group_bus_cancelled_booking_frees_seats(client, register_user, make_tour):
    tour = make_tour(max_group_size=20)
    _, headers = register_user()
    booking = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 20,
    }, headers=headers)
    booking_id = booking.json()["id"]

    full = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 1,
    }, headers=headers)
    assert full.status_code == 409

    cancel = client.patch(f"/tour-bookings/{booking_id}/cancel", headers=headers)
    assert cancel.status_code == 200

    now_fits = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 20,
    }, headers=headers)
    assert now_fits.status_code == 201


# ---------- PRIVATE_CAR_GUIDE: date-range overlap ----------

def test_private_car_guide_requires_end_date(client, register_user, make_tour):
    tour = make_tour(tour_type="PRIVATE_CAR_GUIDE", max_group_size=None, duration_days=None)
    _, headers = register_user()
    res = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01",
    }, headers=headers)
    assert res.status_code == 400


def test_private_car_guide_overlap_rejected(client, register_user, make_tour):
    tour = make_tour(tour_type="PRIVATE_CAR_GUIDE", max_group_size=None, duration_days=None)
    _, headers = register_user()
    first = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "end_date": "2026-10-05",
    }, headers=headers)
    assert first.status_code == 201
    overlapping = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-03", "end_date": "2026-10-08",
    }, headers=headers)
    assert overlapping.status_code == 409


def test_private_car_guide_non_overlapping_dates_allowed(client, register_user, make_tour):
    tour = make_tour(tour_type="PRIVATE_CAR_GUIDE", max_group_size=None, duration_days=None)
    _, headers = register_user()
    first = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "end_date": "2026-10-05",
    }, headers=headers)
    assert first.status_code == 201
    second = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-06", "end_date": "2026-10-10",
    }, headers=headers)
    assert second.status_code == 201


def test_private_car_guide_total_price_is_per_day(client, register_user, make_tour):
    tour = make_tour(tour_type="PRIVATE_CAR_GUIDE", max_group_size=None, duration_days=None, price=8000)
    _, headers = register_user()
    res = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "end_date": "2026-10-03",
    }, headers=headers)
    assert res.status_code == 201
    assert res.json()["total_price"] == 8000 * 3  # 3 inclusive days


# ---------- admin status updates ----------

def test_admin_can_confirm_tour_booking(client, register_admin, register_user, make_tour):
    tour = make_tour()
    _, admin_headers = register_admin()
    _, user_headers = register_user()
    booking = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 2,
    }, headers=user_headers)
    booking_id = booking.json()["id"]

    res = client.patch(f"/tour-bookings/{booking_id}/status", json={"status": "CONFIRMED"}, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CONFIRMED"


def test_user_cannot_confirm_own_tour_booking(client, register_user, make_tour):
    tour = make_tour()
    _, headers = register_user()
    booking = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 2,
    }, headers=headers)
    booking_id = booking.json()["id"]

    res = client.patch(f"/tour-bookings/{booking_id}/status", json={"status": "CONFIRMED"}, headers=headers)
    assert res.status_code == 403


# ---------- delete safety ----------

def test_delete_tour_with_no_bookings_succeeds(client, register_admin, make_tour):
    _, headers = register_admin()
    tour = make_tour()
    res = client.delete(f"/tours/{tour['id']}", headers=headers)
    assert res.status_code == 204
    assert client.get(f"/tours/{tour['id']}").status_code == 404


def test_delete_tour_with_active_bookings_is_blocked(client, register_admin, register_user, make_tour):
    """Mirrors test_delete_vehicle_blocked_when_bookings_exist. This used to be a
    documented gap (see git history) — now fixed to match the vehicles.py behavior."""
    _, admin_headers = register_admin()
    tour = make_tour(max_group_size=10)
    _, user_headers = register_user()

    booking = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 2,
    }, headers=user_headers)
    assert booking.status_code == 201, booking.text

    res = client.delete(f"/tours/{tour['id']}", headers=admin_headers)
    assert res.status_code == 409
    assert "booking" in res.json()["detail"].lower()
    # tour must still exist
    assert client.get(f"/tours/{tour['id']}").status_code == 200


def test_admin_cannot_set_invalid_tour_status(client, register_admin, make_tour):
    _, headers = register_admin()
    tour = make_tour()
    res = client.put(f"/tours/{tour['id']}", json={"status": "DELETED"}, headers=headers)
    assert res.status_code == 422   

def test_admin_cannot_set_invalid_tour_booking_status(client, register_admin, register_user, make_tour):
    tour = make_tour()
    _, admin_headers = register_admin()
    _, user_headers = register_user()
    booking = client.post("/tour-bookings", json={
        "tour_id": tour["id"], "start_date": "2026-10-01", "num_people": 2,
    }, headers=user_headers)
    booking_id = booking.json()["id"]

    res = client.patch(f"/tour-bookings/{booking_id}/status", json={"status": "NOT_A_REAL_STATUS"}, headers=admin_headers)
    assert res.status_code == 422 