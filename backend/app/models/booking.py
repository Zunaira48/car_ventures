from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    pickup_location = Column(String, nullable=True)
    dropoff_location = Column(String, nullable=True)
    with_chauffeur = Column(String, default="no", nullable=False)  # "yes" | "no"

    total_price = Column(Float, nullable=True)
    status = Column(String, default="PENDING", nullable=False)  # PENDING/CONFIRMED/CANCELLED/COMPLETED

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle")
    user = relationship("User")