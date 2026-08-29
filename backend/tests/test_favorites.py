def test_add_favorite(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.post(f"/favorites/{vehicle['id']}", headers=headers)
    assert res.status_code == 201
    assert res.json()["status"] == "added"


def test_add_favorite_requires_auth(client, make_vehicle):
    vehicle = make_vehicle()
    res = client.post(f"/favorites/{vehicle['id']}")
    assert res.status_code in (401, 403)


def test_add_favorite_nonexistent_vehicle_404(client, register_user):
    _, headers = register_user()
    res = client.post("/favorites/999999", headers=headers)
    assert res.status_code == 404


def test_add_favorite_twice_is_idempotent_not_duplicated(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    first = client.post(f"/favorites/{vehicle['id']}", headers=headers)
    assert first.json()["status"] == "added"
    second = client.post(f"/favorites/{vehicle['id']}", headers=headers)
    assert second.status_code == 201
    assert second.json()["status"] == "already_favorited"

    listing = client.get("/favorites", headers=headers)
    assert len(listing.json()) == 1  # not duplicated


def test_list_favorites_only_shows_own(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, user_a_headers = register_user(email="a@example.com")
    _, user_b_headers = register_user(email="b@example.com")
    client.post(f"/favorites/{vehicle['id']}", headers=user_a_headers)

    a_list = client.get("/favorites", headers=user_a_headers)
    b_list = client.get("/favorites", headers=user_b_headers)
    assert len(a_list.json()) == 1
    assert len(b_list.json()) == 0


def test_remove_favorite(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    client.post(f"/favorites/{vehicle['id']}", headers=headers)
    res = client.delete(f"/favorites/{vehicle['id']}", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "removed"
    listing = client.get("/favorites", headers=headers)
    assert listing.json() == []


def test_remove_favorite_not_favorited_404(client, register_user, make_vehicle):
    vehicle = make_vehicle()
    _, headers = register_user()
    res = client.delete(f"/favorites/{vehicle['id']}", headers=headers)
    assert res.status_code == 404