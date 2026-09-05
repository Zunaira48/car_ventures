"""
Turns a free-text vehicle search query (e.g. "cheap automatic sedan in Lahore")
into structured filter parameters via Gemini, using Google's official
google-genai SDK (not raw REST calls) and a Pydantic response schema so the
model can only return the exact shape this app expects.

Uses the official SDK rather than hand-rolled REST calls because Google's newer
"AQ."-prefixed API keys (the format Google AI Studio now issues by default) are
known to fail against the raw REST endpoint's header-based auth for some
accounts - the SDK is Google's own client and is the most likely thing to
handle whatever auth path a given key actually needs.

Kept as a small, isolated module (not inlined in the router) so it can be
mocked cleanly in tests without needing a real API key or network access.
"""
import logging
from typing import Literal

from google import genai  # type: ignore[reportMissingImports]
from google.genai import types  # type: ignore[reportMissingImports]
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

FIELDS = ("location", "category", "transmission", "fuel_type", "min_price", "max_price")

SYSTEM_INSTRUCTION = (
    "You extract vehicle search filters from a short natural-language query for a "
    "Pakistani vehicle rental site (prices in PKR per day). Only set a field when the "
    "query clearly states or numerically implies it - never guess a specific price from "
    "a vague word like \"cheap\" or \"affordable\" alone, since there is no fixed number "
    "for that. \"under 5000\" or \"below 5000\" means max_price=5000. \"above 3000\" or "
    "\"at least 3000\" means min_price=3000. Leave every field you're not confident about as null."
)


class _ParsedFilters(BaseModel):
    location: str | None = None
    category: Literal["Economy", "Hatchback", "Sedan", "SUV", "Luxury", "Hybrid", "Pickup"] | None = None
    transmission: Literal["Automatic", "Manual"] | None = None
    fuel_type: Literal["Petrol", "Diesel", "Hybrid"] | None = None
    min_price: float | None = None
    max_price: float | None = None


def parse_search_query(query: str) -> dict:
    """Returns a dict with exactly the FIELDS keys, each either a value or None.

    Raises RuntimeError on any failure (missing API key, network error, bad
    response shape, rate limit from Google) - the router turns that into a
    clean 503 for the client rather than leaking the underlying error.
    """
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=_ParsedFilters,
            ),
        )
        parsed = _ParsedFilters.model_validate_json(response.text)
    except Exception as e:
        logger.warning(f"Gemini search-query parsing failed: {e}")
        raise RuntimeError("Could not parse search query") from e

    return {field: getattr(parsed, field) for field in FIELDS}