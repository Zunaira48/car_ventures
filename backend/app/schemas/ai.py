from pydantic import BaseModel

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