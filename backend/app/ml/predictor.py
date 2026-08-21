"""
Loads the trained price-prediction model once at import time (not per-request).
If the model file is missing or fails to load, `MODEL` stays None and the router
returns a clear 'service unavailable' response instead of crashing the app -
per the project's AI fallback requirement.
"""
import logging
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "price_model.joblib"
MODEL = None

try:
    MODEL = joblib.load(MODEL_PATH)
    logger.info(f"Price prediction model loaded from {MODEL_PATH}")
except Exception as e:
    logger.warning(f"Could not load price prediction model from {MODEL_PATH}: {e}")
    MODEL = None


def predict_price(features: dict) -> float:
    """features must contain exactly the columns the model was trained on."""
    if MODEL is None:
        raise RuntimeError("Price prediction model is not loaded")
    import pandas as pd
    df = pd.DataFrame([features])
    prediction = MODEL.predict(df)[0]
    return round(float(prediction), -3)  # round to nearest 1,000 PKR