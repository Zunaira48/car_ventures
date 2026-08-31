from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.review import Review
from app.models.booking import Booking
from app.models.favorite import Favorite
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.schemas.review import ReviewOut, VehicleReviewsOut
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    location: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    transmission: str | None = None,
    fuel_type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = db.query(Vehicle).filter(Vehicle.status == "APPROVED")

    if location:
        query = query.filter(Vehicle.location.ilike(f"%{location}%"))
    if category:
        query = query.filter(Vehicle.category == category)
    if transmission:
        query = query.filter(Vehicle.transmission == transmission)
    if fuel_type:
        query = query.filter(Vehicle.fuel_type == fuel_type)
    if min_price is not None:
        query = query.filter(Vehicle.rental_price >= min_price)
    if max_price is not None:
        query = query.filter(Vehicle.rental_price <= max_price)

    offset = (page - 1) * page_size
    return query.order_by(Vehicle.created_at.desc()).offset(offset).limit(page_size).all()

@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle

@router.get("/{vehicle_id}/reviews", response_model=VehicleReviewsOut)
def get_vehicle_reviews(vehicle_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Review, User.full_name)
        .join(User, User.id == Review.user_id)
        .filter(Review.vehicle_id == vehicle_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    reviews = [
        ReviewOut(
            id=r.id, vehicle_id=r.vehicle_id, user_id=r.user_id,
            reviewer_name=name, rating=r.rating, comment=r.comment, created_at=r.created_at,
        )
        for r, name in rows
    ]
    avg = db.query(func.avg(Review.rating)).filter(Review.vehicle_id == vehicle_id).scalar()
    return VehicleReviewsOut(
        average_rating=round(avg, 1) if avg is not None else None,
        count=len(reviews),
        reviews=reviews,
    )

@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = Vehicle(**payload.model_dump(), owner_id=current_user.id, status="PENDING")
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "status":
            value = payload.status.value
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    booking_count = db.query(Booking).filter(Booking.vehicle_id == vehicle_id).count()
    if booking_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: this vehicle has {booking_count} booking(s) on record. "
                   f"Set its status to SUSPENDED instead to hide it from listings without losing booking history.",
        )

    db.query(Favorite).filter(Favorite.vehicle_id == vehicle_id).delete()
    db.query(Review).filter(Review.vehicle_id == vehicle_id).delete()
    db.delete(vehicle)
    db.commit()