def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_db_ok(client):
    res = client.get("/health/db")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "connected"}


def test_health_db_failure_does_not_leak_exception_details(client, monkeypatch):
    from app import main as main_module

    def _broken_connect():
        raise RuntimeError("password authentication failed for user \"secret_internal_detail\"")

    monkeypatch.setattr(main_module.engine, "connect", _broken_connect)

    res = client.get("/health/db")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "error"
    assert "secret_internal_detail" not in body["database"]
    assert body["database"] == "unavailable"