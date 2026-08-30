from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tour import Tour
from app.models.tour_booking import TourBooking
from app.models.user import User
from app.schemas.tour import TourCreate, TourUpdate, TourOut
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/tours", tags=["tours"])

@router.get("", response_model=list[TourOut])
def list_tours(db: Session = Depends(get_db), tour_type: str | None = None, destination: str | None = None):
    query = db.query(Tour).filter(Tour.status == "ACTIVE")
    if tour_type:
        query = query.filter(Tour.tour_type == tour_type)
    if destination:
        query = query.filter(Tour.destination.ilike(f"%{destination}%"))
    return query.order_by(Tour.created_at.desc()).all()

@router.get("/{tour_id}", response_model=TourOut)
def get_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    return tour

@router.post("", response_model=TourOut, status_code=status.HTTP_201_CREATED)
def create_tour(payload: TourCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    tour = Tour(**payload.model_dump())
    db.add(tour)
    db.commit()
    db.refresh(tour)
    return tour

@router.put("/{tour_id}", response_model=TourOut)
def update_tour(tour_id: int, payload: TourUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "status":
            value = payload.status.value
        setattr(tour, field, value)
    db.commit()
    db.refresh(tour)
    return tour

@router.delete("/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour(tour_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    booking_count = db.query(TourBooking).filter(TourBooking.tour_id == tour_id).count()
    if booking_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: this tour has {booking_count} booking(s) on record. "
                   f"Set its status to INACTIVE instead to hide it from listings without losing booking history.",
        )

    db.delete(tour)
    db.commit()