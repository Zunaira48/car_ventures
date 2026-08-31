from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.schemas.common import VehicleStatus

class VehicleCreate(BaseModel):
    title: str
    make: str
    model: str
    year: int
    category: str
    body_type: str | None = None
    transmission: str | None = None
    fuel_type: str | None = None
    engine: str | None = None
    mileage: int | None = None
    seats: int | None = None
    color: str | None = None
    location: str
    rental_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    features: list[str] | None = None
    images: list[str] | None = None

class VehicleUpdate(BaseModel):
    title: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None
    category: str | None = None
    body_type: str | None = None
    transmission: str | None = None
    fuel_type: str | None = None
    engine: str | None = None
    mileage: int | None = None
    seats: int | None = None
    color: str | None = None
    location: str | None = None
    rental_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    features: list[str] | None = None
    images: list[str] | None = None
    status: VehicleStatus | None = None

class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    make: str
    model: str
    year: int
    category: str
    body_type: str | None
    transmission: str | None
    fuel_type: str | None
    engine: str | None
    mileage: int | None
    seats: int | None
    color: str | None
    location: str
    rental_price: float | None
    sale_price: float | None
    description: str | None
    features: list[str] | None
    images: list[str] | None
    owner_id: int
    status: str
    created_at: datetime