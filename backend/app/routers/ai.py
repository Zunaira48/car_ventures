from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import PricePredictionRequest, PricePredictionResponse
from app.ml.predictor import predict_price, MODEL

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/predict-price", response_model=PricePredictionResponse)
def predict_price_endpoint(payload: PricePredictionRequest):
    if MODEL is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Price estimation service is temporarily unavailable. You can still browse and list vehicles normally.",
        )
    try:
        features = {
            "make": payload.make, "model": payload.model, "category": payload.category,
            "body_type": payload.body_type, "transmission": payload.transmission,
            "fuel_type": payload.fuel_type, "engine": payload.engine,
            "location": payload.location, "year": payload.year,
            "mileage": payload.mileage, "seats": payload.seats,
        }
        price = predict_price(features)
        return PricePredictionResponse(estimated_price=price)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate a price estimate for these vehicle details. You can still list the vehicle without one.",
        )