from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config import settings
from app.database import engine
from app.rate_limit import limiter
from app.routers import auth, vehicles, bookings, admin, favorites, reviews, tours, tour_bookings, notifications, ai

app = FastAPI(title="Vehicle Platform API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(favorites.router)
app.include_router(reviews.router)
app.include_router(tours.router)
app.include_router(tour_bookings.router)
app.include_router(notifications.router)
app.include_router(ai.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return {"status": "error", "database": "unavailable"}