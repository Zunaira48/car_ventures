def test_register_creates_user_with_role_user(register_user):
    user, _ = register_user()
    assert user["role"] == "user"
    assert user["email"] == "user@example.com"


def test_register_duplicate_email_rejected(client):
    payload = {"full_name": "A", "email": "dupe@example.com", "password": "pass1234"}
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/auth/register", json=payload)
    assert second.status_code == 409


def test_register_with_admin_email_gets_admin_role(register_admin):
    user, _ = register_admin()
    assert user["role"] == "admin"


def test_register_with_non_admin_email_does_not_get_admin_role(register_user):
    # sanity check on the other side of the same rule tested above
    user, _ = register_user(email="definitely-not-admin@example.com")
    assert user["role"] == "user"


def test_login_wrong_password_rejected(client):
    client.post("/auth/register", json={"full_name": "A", "email": "x@example.com", "password": "correctpass"})
    res = client.post("/auth/login", json={"email": "x@example.com", "password": "wrongpass"})
    assert res.status_code == 401


def test_login_unknown_email_rejected(client):
    res = client.post("/auth/login", json={"email": "nobody@example.com", "password": "whatever123"})
    assert res.status_code == 401


def test_me_requires_auth(client):
    res = client.get("/auth/me")
    # HTTPBearer raises 403 when no Authorization header is present at all,
    # 401 only for a present-but-invalid token — both count as "not allowed in".
    assert res.status_code in (401, 403)


def test_me_rejects_garbage_token(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401


def test_me_returns_current_user(client, register_user):
    user, headers = register_user()
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == user["id"]
    assert res.json()["email"] == user["email"]