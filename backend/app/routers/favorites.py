from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.favorite import Favorite
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.get("", response_model=list[VehicleOut])
def list_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Vehicle)
        .join(Favorite, Favorite.vehicle_id == Vehicle.id)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.vehicle_id == vehicle_id
    ).first()
    if existing:
        return {"status": "already_favorited"}

    favorite = Favorite(user_id=current_user.id, vehicle_id=vehicle_id)
    db.add(favorite)
    db.commit()
    return {"status": "added"}

@router.delete("/{vehicle_id}")
def remove_favorite(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.vehicle_id == vehicle_id
    ).first()
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
    return {"status": "removed"}