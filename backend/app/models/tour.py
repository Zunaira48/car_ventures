from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, func
from app.database import Base

class Tour(Base):
    __tablename__ = "tours"

    id = Column(Integer, primary_key=True, index=True)
    tour_type = Column(String, nullable=False, index=True)  # GROUP_BUS | PRIVATE_CAR_GUIDE
    title = Column(String, nullable=False)
    destination = Column(String, nullable=False, index=True)  # e.g. "Hunza Valley", "Lahore"
    description = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=True)  # meaningful for GROUP_BUS; informational for PRIVATE_CAR_GUIDE
    price = Column(Float, nullable=False)  # per person for GROUP_BUS, per day for PRIVATE_CAR_GUIDE
    max_group_size = Column(Integer, nullable=True)  # GROUP_BUS only
    included_facilities = Column(JSON, nullable=True)  # list[str], e.g. ["Accommodation", "Meals", "Guide"]
    images = Column(JSON, nullable=True)  # list[str]
    status = Column(String, default="ACTIVE", nullable=False)  # ACTIVE | INACTIVE

    created_at = Column(DateTime(timezone=True), server_default=func.now())