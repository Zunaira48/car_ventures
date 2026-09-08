def test_parse_search_returns_structured_filters(client, monkeypatch):
    from app.routers import ai as ai_router

    monkeypatch.setattr(
        ai_router,
        "parse_search_query",
        lambda query: {
            "location": "Lahore", "category": "Sedan", "transmission": "Automatic",
            "fuel_type": None, "min_price": None, "max_price": 5000,
        },
    )

    res = client.post("/ai/parse-search", json={"query": "automatic sedan in Lahore under 5000"})
    assert res.status_code == 200
    body = res.json()
    assert body["location"] == "Lahore"
    assert body["category"] == "Sedan"
    assert body["transmission"] == "Automatic"
    assert body["fuel_type"] is None
    assert body["max_price"] == 5000


def test_parse_search_rejects_empty_query(client):
    res = client.post("/ai/parse-search", json={"query": ""})
    assert res.status_code == 422


def test_parse_search_returns_503_when_gemini_unavailable(client, monkeypatch):
    from app.routers import ai as ai_router

    def _boom(query):
        raise RuntimeError("GEMINI_API_KEY is not configured")

    monkeypatch.setattr(ai_router, "parse_search_query", _boom)

    res = client.post("/ai/parse-search", json={"query": "cheap hatchback"})
    assert res.status_code == 503


def test_parse_search_is_rate_limited_after_10_attempts_per_minute(client, monkeypatch):
    from app.routers import ai as ai_router

    monkeypatch.setattr(
        ai_router,
        "parse_search_query",
        lambda query: {k: None for k in ("location", "category", "transmission", "fuel_type", "min_price", "max_price")},
    )

    for _ in range(10):
        res = client.post("/ai/parse-search", json={"query": "sedan"})
        assert res.status_code == 200
    res = client.post("/ai/parse-search", json={"query": "sedan"})
    assert res.status_code == 429

def test_predict_price_failure_is_logged_server_side(client, monkeypatch, caplog):
    from app.routers import ai as ai_router

    monkeypatch.setattr(ai_router, "MODEL", object())  # non-None, so the "unavailable" short-circuit is skipped

    def _boom(features):
        raise ValueError("model expects a different feature shape")

    monkeypatch.setattr(ai_router, "predict_price", _boom)

    payload = {
        "make": "Toyota", "model": "Corolla", "year": 2019, "category": "Sedan",
        "body_type": "Sedan", "transmission": "Automatic", "fuel_type": "Petrol",
        "engine": "1.8L", "mileage": 40000, "seats": 5, "location": "Lahore",
    }

    with caplog.at_level("ERROR", logger="app.routers.ai"):
        res = client.post("/ai/predict-price", json=payload)

    assert res.status_code == 503
    assert "model expects a different feature shape" in caplog.text