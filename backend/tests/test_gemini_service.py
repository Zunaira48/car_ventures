import pytest

from app.services import gemini as gemini_service


class _FakeResponse:
    def __init__(self, text):
        self.text = text


class _FakeModels:
    def __init__(self, response_text=None, raise_exc=None):
        self._response_text = response_text
        self._raise_exc = raise_exc

    def generate_content(self, model, contents, config):
        if self._raise_exc:
            raise self._raise_exc
        return _FakeResponse(self._response_text)


class _FakeClient:
    def __init__(self, response_text=None, raise_exc=None):
        self.models = _FakeModels(response_text, raise_exc)


def _mock_client(monkeypatch, response_text=None, raise_exc=None):
    monkeypatch.setattr(
        gemini_service.genai,
        "Client",
        lambda api_key: _FakeClient(response_text=response_text, raise_exc=raise_exc),
    )


def test_parse_search_query_requires_api_key(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "")
    with pytest.raises(RuntimeError, match="not configured"):
        gemini_service.parse_search_query("cheap sedan")


def test_parse_search_query_extracts_all_fields(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "fake-key-for-test")
    _mock_client(monkeypatch, response_text=(
        '{"location": "Karachi", "category": "SUV", "transmission": "Manual", '
        '"fuel_type": "Diesel", "min_price": 3000, "max_price": 8000}'
    ))

    result = gemini_service.parse_search_query("manual diesel SUV in Karachi, 3000 to 8000")
    assert result == {
        "location": "Karachi", "category": "SUV", "transmission": "Manual",
        "fuel_type": "Diesel", "min_price": 3000, "max_price": 8000,
    }


def test_parse_search_query_fills_missing_fields_with_none(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "fake-key-for-test")
    _mock_client(monkeypatch, response_text='{"category": "Hatchback"}')

    result = gemini_service.parse_search_query("hatchback")
    assert result["category"] == "Hatchback"
    assert result["location"] is None
    assert result["min_price"] is None


def test_parse_search_query_raises_runtime_error_when_sdk_call_fails(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "fake-key-for-test")
    _mock_client(monkeypatch, raise_exc=Exception("boom"))

    with pytest.raises(RuntimeError):
        gemini_service.parse_search_query("anything")


def test_parse_search_query_raises_runtime_error_on_malformed_json(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "fake-key-for-test")
    _mock_client(monkeypatch, response_text="not valid json at all")

    with pytest.raises(RuntimeError):
        gemini_service.parse_search_query("anything")


def test_parse_search_query_raises_runtime_error_on_invalid_enum_value(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "fake-key-for-test")
    _mock_client(monkeypatch, response_text='{"category": "Convertible"}')

    with pytest.raises(RuntimeError):
        gemini_service.parse_search_query("convertible")