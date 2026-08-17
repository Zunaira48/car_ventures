from pydantic import BaseModel, field_validator
from datetime import datetime

class ReviewCreate(BaseModel):
    vehicle_id: int
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v):
        if not (1 <= v <= 5):
            raise ValueError("rating must be between 1 and 5")
        return v

class ReviewUpdate(BaseModel):
    rating: int | None = None
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v):
        if v is not None and not (1 <= v <= 5):
            raise ValueError("rating must be between 1 and 5")
        return v

class ReviewOut(BaseModel):
    id: int
    vehicle_id: int
    user_id: int
    reviewer_name: str
    rating: int
    comment: str | None
    created_at: datetime

class VehicleReviewsOut(BaseModel):
    average_rating: float | None
    count: int
    reviews: list[ReviewOut]