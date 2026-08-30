from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime
from app.schemas.common import BookingStatus, TourStatus

VALID_TOUR_TYPES = {"GROUP_BUS", "PRIVATE_CAR_GUIDE"}

class TourCreate(BaseModel):
    tour_type: str
    title: str
    destination: str
    description: str | None = None
    duration_days: int | None = None
    price: float
    max_group_size: int | None = None
    included_facilities: list[str] | None = None
    images: list[str] | None = None

    @field_validator("tour_type")
    @classmethod
    def valid_type(cls, v):
        if v not in VALID_TOUR_TYPES:
            raise ValueError(f"tour_type must be one of {VALID_TOUR_TYPES}")
        return v

class TourUpdate(BaseModel):
    title: str | None = None
    destination: str | None = None
    description: str | None = None
    duration_days: int | None = None
    price: float | None = None
    max_group_size: int | None = None
    included_facilities: list[str] | None = None
    images: list[str] | None = None
    status: TourStatus | None = None

class TourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tour_type: str
    title: str
    destination: str
    description: str | None
    duration_days: int | None
    price: float
    max_group_size: int | None
    included_facilities: list[str] | None
    images: list[str] | None
    status: str
    created_at: datetime

class TourBookingCreate(BaseModel):
    tour_id: int
    start_date: date
    end_date: date | None = None  # required for PRIVATE_CAR_GUIDE
    num_people: int = 1

class TourBookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tour_id: int
    user_id: int
    start_date: date
    end_date: date | None
    num_people: int
    total_price: float | None
    status: str
    created_at: datetime

class TourBookingStatusUpdate(BaseModel):
    status: BookingStatus