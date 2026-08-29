def test_booking_creates_a_notification(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=headers)

    res = client.get("/notifications/my", headers=headers)
    assert res.status_code == 200
    notifications = res.json()
    assert len(notifications) == 1
    assert notifications[0]["is_read"] is False


def test_notifications_requires_auth(client):
    res = client.get("/notifications/my")
    assert res.status_code in (401, 403)


def test_unread_count(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=headers)
    res = client.get("/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 1


def test_mark_single_notification_read(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=headers)
    notif_id = client.get("/notifications/my", headers=headers).json()[0]["id"]

    res = client.patch(f"/notifications/{notif_id}/read", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_read"] is True

    count = client.get("/notifications/unread-count", headers=headers)
    assert count.json()["unread_count"] == 0


def test_cannot_mark_someone_elses_notification_read(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, owner_headers = register_user(email="owner@example.com")
    client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=owner_headers)
    notif_id = client.get("/notifications/my", headers=owner_headers).json()[0]["id"]

    _, other_headers = register_user(email="someone-else@example.com")
    res = client.patch(f"/notifications/{notif_id}/read", headers=other_headers)
    assert res.status_code == 403


def test_mark_nonexistent_notification_read_404s(client, register_user):
    _, headers = register_user()
    res = client.patch("/notifications/999999/read", headers=headers)
    assert res.status_code == 404


def test_mark_all_read(client, register_user, make_vehicle):
    vehicle_a = make_vehicle(title="Car A")
    vehicle_b = make_vehicle(title="Car B")
    _, headers = register_user()
    client.post("/bookings", json={"vehicle_id": vehicle_a["id"], "start_date": "2026-09-01", "end_date": "2026-09-02"}, headers=headers)
    client.post("/bookings", json={"vehicle_id": vehicle_b["id"], "start_date": "2026-09-01", "end_date": "2026-09-02"}, headers=headers)

    assert client.get("/notifications/unread-count", headers=headers).json()["unread_count"] == 2

    res = client.patch("/notifications/read-all", headers=headers)
    assert res.status_code == 200
    assert client.get("/notifications/unread-count", headers=headers).json()["unread_count"] == 0


def test_booking_status_change_by_admin_notifies_the_booking_owner(client, register_admin, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, admin_headers = register_admin()
    _, user_headers = register_user()
    booking = client.post("/bookings", json={
        "vehicle_id": vehicle["id"], "start_date": "2026-09-01", "end_date": "2026-09-03",
    }, headers=user_headers)
    booking_id = booking.json()["id"]

    # 1 notification so far (booking submitted)
    assert client.get("/notifications/unread-count", headers=user_headers).json()["unread_count"] == 1

    client.patch(f"/bookings/{booking_id}/status", json={"status": "CONFIRMED"}, headers=admin_headers)

    # confirming should add a second notification for the booking's owner (not the admin)
    assert client.get("/notifications/unread-count", headers=user_headers).json()["unread_count"] == 2
    assert client.get("/notifications/unread-count", headers=admin_headers).json()["unread_count"] == 0