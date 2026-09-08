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

def test_health_db_failure_logs_the_real_exception_server_side(client, monkeypatch, caplog):
    from app import main as main_module

    def _broken_connect():
        raise RuntimeError("password authentication failed for user \"secret_internal_detail\"")

    monkeypatch.setattr(main_module.engine, "connect", _broken_connect)

    with caplog.at_level("ERROR", logger="app.main"):
        client.get("/health/db")

    # The detail is deliberately kept OUT of the HTTP response (previous test),
    # but it must still reach the server-side log, or a real outage becomes invisible.
    assert "secret_internal_detail" in caplog.text


def test_configure_logging_applies_the_configured_level(monkeypatch):
    import logging
    from app.config import settings
    from app.logging_config import configure_logging

    monkeypatch.setattr(settings, "log_level", "DEBUG")
    configure_logging()
    assert logging.getLogger().level == logging.DEBUG

    monkeypatch.setattr(settings, "log_level", "INFO")
    configure_logging()
    assert logging.getLogger().level == logging.INFO