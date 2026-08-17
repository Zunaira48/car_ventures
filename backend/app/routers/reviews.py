from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.review import Review
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    existing = db.query(Review).filter(
        Review.user_id == current_user.id, Review.vehicle_id == payload.vehicle_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this vehicle. Use PUT /reviews/{vehicle_id} to update it.",
        )

    review = Review(
        vehicle_id=payload.vehicle_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewOut(
        id=review.id, vehicle_id=review.vehicle_id, user_id=review.user_id,
        reviewer_name=current_user.full_name, rating=review.rating,
        comment=review.comment, created_at=review.created_at,
    )

@router.put("/{vehicle_id}", response_model=ReviewOut)
def update_review(vehicle_id: int, payload: ReviewUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.user_id == current_user.id, Review.vehicle_id == vehicle_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You haven't reviewed this vehicle yet")

    if payload.rating is not None:
        review.rating = payload.rating
    if payload.comment is not None:
        review.comment = payload.comment
    db.commit()
    db.refresh(review)
    return ReviewOut(
        id=review.id, vehicle_id=review.vehicle_id, user_id=review.user_id,
        reviewer_name=current_user.full_name, rating=review.rating,
        comment=review.comment, created_at=review.created_at,
    )

@router.delete("/{vehicle_id}")
def delete_review(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.user_id == current_user.id, Review.vehicle_id == vehicle_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You haven't reviewed this vehicle yet")
    db.delete(review)
    db.commit()
    return {"status": "removed"}