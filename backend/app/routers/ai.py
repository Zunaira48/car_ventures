import logging

from fastapi import APIRouter, HTTPException, Request, status
from app.schemas.ai import PricePredictionRequest, PricePredictionResponse, SearchParseRequest, SearchParseResponse
from app.ml.predictor import predict_price, MODEL
from app.services.gemini import parse_search_query
from app.rate_limit import limiter

logger = logging.getLogger(__name__)

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
    except Exception as e:
        logger.error(f"Price prediction failed for payload={payload.model_dump()}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate a price estimate for these vehicle details. You can still list the vehicle without one.",
        )


@router.post("/parse-search", response_model=SearchParseResponse)
@limiter.limit("10/minute")
def parse_search_endpoint(request: Request, payload: SearchParseRequest):
    try:
        result = parse_search_query(payload.query)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Natural-language search is temporarily unavailable. Please use the filters directly.",
        )
    return SearchParseResponse(**result)