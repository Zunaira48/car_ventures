from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.models.tour import Tour
from app.models.tour_booking import TourBooking
from app.models.user import User
from app.schemas.tour import TourBookingCreate, TourBookingOut, TourBookingStatusUpdate
from app.auth.dependencies import get_current_user, require_admin
from app.services.notifications import notify

router = APIRouter(prefix="/tour-bookings", tags=["tour-bookings"])

ACTIVE_STATUSES = ["PENDING", "CONFIRMED"]


def booked_seats(db: Session, tour_id: int, start_date, exclude_booking_id: int | None = None) -> int:
    """Sum of num_people across active bookings for this tour on this exact departure date."""
    query = db.query(func.coalesce(func.sum(TourBooking.num_people), 0)).filter(
        TourBooking.tour_id == tour_id,
        TourBooking.start_date == start_date,
        TourBooking.status.in_(ACTIVE_STATUSES),
    )
    if exclude_booking_id:
        query = query.filter(TourBooking.id != exclude_booking_id)
    return query.scalar() or 0


def has_overlap(db: Session, tour_id: int, start_date, end_date, exclude_booking_id: int | None = None) -> bool:
    """Same interval-overlap test used for vehicle bookings - one dedicated car+driver per tour."""
    query = db.query(TourBooking).filter(
        TourBooking.tour_id == tour_id,
        TourBooking.status.in_(ACTIVE_STATUSES),
        and_(
            start_date <= TourBooking.end_date,
            TourBooking.start_date <= end_date,
        ),
    )
    if exclude_booking_id:
        query = query.filter(TourBooking.id != exclude_booking_id)
    return db.query(query.exists()).scalar()


@router.post("", response_model=TourBookingOut, status_code=status.HTTP_201_CREATED)
def create_tour_booking(payload: TourBookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tour = db.query(Tour).filter(Tour.id == payload.tour_id, Tour.status == "ACTIVE").first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found or not available")

    if tour.tour_type == "GROUP_BUS":
        if payload.num_people < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="num_people must be at least 1")
        if tour.max_group_size is not None:
            already_booked = booked_seats(db, tour.id, payload.start_date)
            if already_booked + payload.num_people > tour.max_group_size:
                remaining = max(tour.max_group_size - already_booked, 0)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Only {remaining} seat(s) left for this departure date",
                )
        end_date = payload.start_date + timedelta(days=(tour.duration_days or 1) - 1)
        total_price = tour.price * payload.num_people

    elif tour.tour_type == "PRIVATE_CAR_GUIDE":
        if not payload.end_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date is required for this tour type")
        if has_overlap(db, tour.id, payload.start_date, payload.end_date):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This private car and guide is already booked for part or all of the selected dates",
            )
        end_date = payload.end_date
        days = (payload.end_date - payload.start_date).days + 1
        total_price = tour.price * days

    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unknown tour type")

    booking = TourBooking(
        tour_id=tour.id,
        user_id=current_user.id,
        start_date=payload.start_date,
        end_date=end_date,
        num_people=payload.num_people,
        total_price=total_price,
        status="PENDING",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    notify(db, current_user.id, f"Your booking request for {tour.title} has been submitted and is pending approval.", "/tour-bookings")
    db.commit()
    return booking


@router.get("/my", response_model=list[TourBookingOut])
def my_tour_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TourBooking).filter(TourBooking.user_id == current_user.id).order_by(TourBooking.created_at.desc()).all()


@router.patch("/{booking_id}/cancel", response_model=TourBookingOut)
def cancel_tour_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(TourBooking).filter(TourBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking")
    if booking.status in ("CANCELLED", "COMPLETED"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Booking already {booking.status.lower()}")
    booking.status = "CANCELLED"
    db.commit()
    db.refresh(booking)
    notify(db, booking.user_id, "Your tour booking has been cancelled.", "/tour-bookings")
    db.commit()
    return booking


@router.patch("/{booking_id}/status", response_model=TourBookingOut)
def update_tour_booking_status(
    booking_id: int,
    payload: TourBookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    booking = db.query(TourBooking).filter(TourBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    status_messages = {
        "CONFIRMED": "Your tour booking has been confirmed.",
        "CANCELLED": "Your tour booking has been cancelled by the admin.",
        "COMPLETED": "Your tour has been marked as completed. We hope you enjoyed it!",
    }
    if payload.status in status_messages:
        notify(db, booking.user_id, status_messages[payload.status], "/tour-bookings")
        db.commit()
    return booking