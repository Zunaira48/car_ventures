from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, BookingStatusUpdate
from app.auth.dependencies import get_current_user, require_admin
from app.services.notifications import notify

router = APIRouter(prefix="/bookings", tags=["bookings"])

ACTIVE_STATUSES = ["PENDING", "CONFIRMED"]


def has_overlap(db: Session, vehicle_id: int, start_date, end_date, exclude_booking_id: int | None = None) -> bool:
    """
    Two ranges [start_date, end_date] and [b.start_date, b.end_date] overlap when:
        start_date <= b.end_date AND b.start_date <= end_date
    This is the standard interval-overlap test: if neither range ends before the
    other starts, they must overlap somewhere.
    """
    query = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_(ACTIVE_STATUSES),
        and_(
            start_date <= Booking.end_date,
            Booking.start_date <= end_date,
        ),
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    return db.query(query.exists()).scalar()


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id, Vehicle.status == "APPROVED").first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found or not available")

    if has_overlap(db, payload.vehicle_id, payload.start_date, payload.end_date):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is already booked for part or all of the selected dates",
        )

    days = (payload.end_date - payload.start_date).days + 1
    total_price = (vehicle.rental_price or 0) * days

    booking = Booking(
        vehicle_id=payload.vehicle_id,
        user_id=current_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        pickup_location=payload.pickup_location,
        dropoff_location=payload.dropoff_location,
        with_chauffeur=payload.with_chauffeur,
        total_price=total_price,
        status="PENDING",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    notify(db, current_user.id, f"Your booking request for {vehicle.title} has been submitted and is pending approval.", "/bookings")
    db.commit()
    return booking


@router.get("/my", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this booking")
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking")
    if booking.status in ("CANCELLED", "COMPLETED"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Booking already {booking.status.lower()}")
    booking.status = "CANCELLED"
    db.commit()
    db.refresh(booking)
    notify(db, booking.user_id, "Your booking has been cancelled.", "/bookings")
    db.commit()
    return booking


@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    status_messages = {
        "CONFIRMED": "Your booking has been confirmed.",
        "CANCELLED": "Your booking has been cancelled by the admin.",
        "COMPLETED": "Your booking has been marked as completed. Feel free to leave a review!",
    }
    if payload.status in status_messages:
        notify(db, booking.user_id, status_messages[payload.status], "/bookings")
        db.commit()
    return booking