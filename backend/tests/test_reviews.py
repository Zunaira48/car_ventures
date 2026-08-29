def test_create_review(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 5, "comment": "Great car"}, headers=headers)
    assert res.status_code == 201, res.text
    assert res.json()["rating"] == 5


def test_review_requires_auth(client, make_vehicle):
    vehicle = make_vehicle()
    res = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 5})
    assert res.status_code in (401, 403)


def test_review_rating_out_of_range_rejected(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 6}, headers=headers)
    assert res.status_code == 422
    res2 = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 0}, headers=headers)
    assert res2.status_code == 422


def test_duplicate_review_same_user_same_vehicle_rejected(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 4}, headers=headers)
    assert first.status_code == 201
    second = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 2}, headers=headers)
    assert second.status_code == 409


def test_review_open_to_any_logged_in_user_no_booking_required(client, register_user, make_vehicle):
    # deliberate project design choice per the handover — not gated by a completed booking
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 5}, headers=headers)
    assert res.status_code == 201


def test_update_own_review(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 3, "comment": "ok"}, headers=headers)
    res = client.put(f"/reviews/{vehicle['id']}", json={"rating": 5, "comment": "actually great"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["rating"] == 5
    assert res.json()["comment"] == "actually great"


def test_update_review_that_does_not_exist_404(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.put(f"/reviews/{vehicle['id']}", json={"rating": 5}, headers=headers)
    assert res.status_code == 404


def test_delete_own_review(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 3}, headers=headers)
    res = client.delete(f"/reviews/{vehicle['id']}", headers=headers)
    assert res.status_code == 200


def test_average_rating_computed_correctly(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, user_a = register_user(email="a@example.com")
    _, user_b = register_user(email="b@example.com")
    client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 5}, headers=user_a)
    client.post("/reviews", json={"vehicle_id": vehicle["id"], "rating": 3}, headers=user_b)

    res = client.get(f"/vehicles/{vehicle['id']}/reviews")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 2
    assert data["average_rating"] == 4.0