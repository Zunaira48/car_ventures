from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class TourBooking(Base):
    __tablename__ = "tour_bookings"

    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # used for PRIVATE_CAR_GUIDE; GROUP_BUS derives from tour.duration_days
    num_people = Column(Integer, default=1, nullable=False)  # used for GROUP_BUS capacity

    total_price = Column(Float, nullable=True)
    status = Column(String, default="PENDING", nullable=False)  # PENDING/CONFIRMED/CANCELLED/COMPLETED

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tour = relationship("Tour")
    user = relationship("User")