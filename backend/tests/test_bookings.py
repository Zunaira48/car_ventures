def _book(client, headers, vehicle_id, start, end):
    return client.post("/bookings", json={
        "vehicle_id": vehicle_id, "start_date": start, "end_date": end,
    }, headers=headers)


def test_booking_requires_auth(client, make_vehicle):
    vehicle = make_vehicle()
    res = client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    })
    assert res.status_code in (401, 403)


def test_booking_pending_vehicle_not_bookable(client, register_admin, register_user):
    _, admin_headers = register_admin()
    create = client.post("/vehicles", json={
        "title": "Unapproved Car", "make": "Honda", "model": "Civic", "year": 2019,
        "category": "Sedan", "location": "Karachi", "rental_price": 4000,
    }, headers=admin_headers)
    vehicle_id = create.json()["id"]  # still PENDING, never approved

    _, user_headers = register_user()
    res = _book(client, user_headers, vehicle_id, "2026-09-01", "2026-09-03")
    assert res.status_code == 404


def test_end_date_before_start_date_rejected(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = _book(client, headers, vehicle["id"], "2026-09-05", "2026-09-01")
    assert res.status_code == 422  # pydantic validator on the schema catches this


def test_successful_booking_computes_total_price(client, register_user, make_vehicle):
    vehicle = make_vehicle(rental_price=5000)
    _, headers = register_user()
    res = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-03")
    assert res.status_code == 201, res.text
    # 3 inclusive days (1st, 2nd, 3rd) * 5000/day
    assert res.json()["total_price"] == 15000
    assert res.json()["status"] == "PENDING"


def test_exact_same_dates_overlap_rejected(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-05")
    assert first.status_code == 201
    second = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-05")
    assert second.status_code == 409


def test_partial_overlap_rejected(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-10")
    assert first.status_code == 201
    # starts inside the first booking's range
    second = _book(client, headers, vehicle["id"], "2026-09-08", "2026-09-15")
    assert second.status_code == 409
    # ends inside the first booking's range
    third = _book(client, headers, vehicle["id"], "2026-08-25", "2026-09-02")
    assert third.status_code == 409
    # fully contains the first booking's range
    fourth = _book(client, headers, vehicle["id"], "2026-08-20", "2026-09-20")
    assert fourth.status_code == 409


def test_adjacent_non_overlapping_dates_allowed(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-05")
    assert first.status_code == 201
    # starts the day after the first one ends — should NOT count as overlap
    second = _book(client, headers, vehicle["id"], "2026-09-06", "2026-09-10")
    assert second.status_code == 201


def test_cancelled_booking_frees_up_the_dates(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-05")
    booking_id = first.json()["id"]

    cancel = client.patch(f"/bookings/{booking_id}/cancel", headers=headers)
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"

    # same dates should now be free since a CANCELLED booking isn't "active"
    second = _book(client, headers, vehicle["id"], "2026-09-01", "2026-09-05")
    assert second.status_code == 201


def test_different_vehicles_do_not_conflict(client, register_user, make_vehicle):
    vehicle_a = make_vehicle(title="Car A")
    vehicle_b = make_vehicle(title="Car B")
    _, headers = register_user()
    first = _book(client, headers, vehicle_a["id"], "2026-09-01", "2026-09-05")
    assert first.status_code == 201
    second = _book(client, headers, vehicle_b["id"], "2026-09-01", "2026-09-05")
    assert second.status_code == 201  # same dates, different vehicle — no conflict


def test_user_cannot_cancel_someone_elses_booking(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, owner_headers = register_user(email="owner@example.com")
    booking = _book(client, owner_headers, vehicle["id"], "2026-09-01", "2026-09-05")
    booking_id = booking.json()["id"]

    _, other_headers = register_user(email="someone-else@example.com")
    res = client.patch(f"/bookings/{booking_id}/cancel", headers=other_headers)
    assert res.status_code == 403


def test_admin_can_confirm_booking(client, register_admin, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, admin_headers = register_admin()
    _, user_headers = register_user()
    booking = _book(client, user_headers, vehicle["id"], "2026-09-01", "2026-09-05")
    booking_id = booking.json()["id"]

    res = client.patch(f"/bookings/{booking_id}/status", json={"status": "CONFIRMED"}, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CONFIRMED"

def test_admin_cannot_set_invalid_booking_status(client, register_admin, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, admin_headers = register_admin()
    _, user_headers = register_user()
    booking = _book(client, user_headers, vehicle["id"], "2026-09-01", "2026-09-05")
    booking_id = booking.json()["id"]

    res = client.patch(f"/bookings/{booking_id}/status", json={"status": "NOT_A_REAL_STATUS"}, headers=admin_headers)
    assert res.status_code == 422