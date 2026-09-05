from pydantic import BaseModel, Field

class PricePredictionRequest(BaseModel):
    make: str
    model: str
    year: int
    category: str
    body_type: str
    transmission: str
    fuel_type: str
    engine: str
    mileage: int
    seats: int
    location: str

class PricePredictionResponse(BaseModel):
    estimated_price: float
    currency: str = "PKR"
    disclaimer: str = (
        "This is an AI-generated estimate based on a synthetic training dataset, "
        "not a guarantee of actual market value. See docs/ai.md for details."
    )

class SearchParseRequest(BaseModel):
    query: str = Field(min_length=1, max_length=300)

class SearchParseResponse(BaseModel):
    location: str | None = None
    category: str | None = None
    transmission: str | None = None
    fuel_type: str | None = None
    min_price: float | None = None
    max_price: float | None = None