from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.booking import Booking
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    total_vehicles = db.query(func.count(Vehicle.id)).scalar()
    pending_vehicles = db.query(func.count(Vehicle.id)).filter(Vehicle.status == "PENDING").scalar()
    active_bookings = db.query(func.count(Booking.id)).filter(Booking.status.in_(["PENDING", "CONFIRMED"])).scalar()
    completed_bookings = db.query(func.count(Booking.id)).filter(Booking.status == "COMPLETED").scalar()
    revenue_estimate = db.query(func.coalesce(func.sum(Booking.total_price), 0)).filter(
        Booking.status.in_(["CONFIRMED", "COMPLETED"])
    ).scalar()

    return {
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "pending_vehicle_approvals": pending_vehicles,
        "active_bookings": active_bookings,
        "completed_bookings": completed_bookings,
        "revenue_estimate": revenue_estimate,
        "note": "revenue_estimate is a sum of recorded booking prices, not actual collected payments (no real payment processing is implemented)",
    }

@router.get("/vehicles/pending")
def pending_vehicles(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    vehicles = db.query(Vehicle).filter(Vehicle.status == "PENDING").order_by(Vehicle.created_at.desc()).all()
    return vehicles

@router.get("/bookings")
def all_bookings(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Booking).order_by(Booking.created_at.desc()).all()

@router.get("/users")
def all_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()