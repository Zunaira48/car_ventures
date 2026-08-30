from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime
from app.schemas.common import BookingStatus

class BookingCreate(BaseModel):
    vehicle_id: int
    start_date: date
    end_date: date
    pickup_location: str | None = None
    dropoff_location: str | None = None
    with_chauffeur: str = "no"

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date must be on or after start_date")
        return v

class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    user_id: int
    start_date: date
    end_date: date
    pickup_location: str | None
    dropoff_location: str | None
    with_chauffeur: str
    total_price: float | None
    status: str
    created_at: datetime

class BookingStatusUpdate(BaseModel):
    status: BookingStatus