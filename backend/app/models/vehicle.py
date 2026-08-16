from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    make = Column(String, nullable=False, index=True)
    model = Column(String, nullable=False, index=True)
    year = Column(Integer, nullable=False)
    category = Column(String, nullable=False, index=True)  # Economy, SUV, Luxury, etc.
    body_type = Column(String, nullable=True)
    transmission = Column(String, nullable=True)  # automatic / manual
    fuel_type = Column(String, nullable=True)
    engine = Column(String, nullable=True)
    mileage = Column(Integer, nullable=True)
    seats = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    location = Column(String, nullable=False, index=True)  # city
    rental_price = Column(Float, nullable=True)   # per day, PKR
    sale_price = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    features = Column(JSON, nullable=True)         # list[str]
    images = Column(JSON, nullable=True)            # list[str] of image URLs

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="PENDING", nullable=False)  # PENDING/APPROVED/REJECTED/SUSPENDED

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")