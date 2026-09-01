import os

# Must be set before anything under app/ is imported, since app.config.Settings
# reads these at import time. Using an in-memory SQLite DB keeps tests fast,
# hermetic, and independent of the real Neon database / any .env file.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("JWT_SECRET", "test-secret-key-not-for-production")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.rate_limit import limiter

# A single shared in-memory SQLite connection for the whole test run (StaticPool
# keeps it alive across sessions instead of each connect() getting a fresh,
# empty in-memory DB). Tables are created/dropped around every individual test.
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _fresh_db():
    """Recreate all tables before every test so tests never see another test's data."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """TestClient always reports the same client IP, so without this every test
    in the suite would share one rate-limit bucket on /auth/register and
    /auth/login and start failing with 429s partway through the run."""
    limiter.reset()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def register_user(client):
    """Registers (or logs in, if already registered this test) a normal user.

    Idempotent on purpose: a test that needs the same user twice (e.g. via a
    shared fixture like make_vehicle) shouldn't have to worry about a 409.
    Returns (user_dict, auth_headers).
    """
    def _register(email="user@example.com", password="testpass123", full_name="Test User"):
        res = client.post("/auth/register", json={
            "full_name": full_name, "email": email, "password": password,
        })
        if res.status_code != 201:
            assert res.status_code == 409, res.text
        login = client.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me = client.get("/auth/me", headers=headers)
        return me.json(), headers
    return _register


@pytest.fixture
def register_admin(client):
    """Registers (or logs in) a user whose email matches ADMIN_EMAIL (auto-assigned admin role)."""
    def _register(password="adminpass123", full_name="Test Admin"):
        email = os.environ["ADMIN_EMAIL"]
        res = client.post("/auth/register", json={
            "full_name": full_name, "email": email, "password": password,
        })
        if res.status_code != 201:
            assert res.status_code == 409, res.text
        login = client.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me = client.get("/auth/me", headers=headers)
        return me.json(), headers
    return _register


@pytest.fixture
def make_vehicle(client, register_admin):
    """Creates and APPROVES a vehicle so it's bookable/listable. Returns the vehicle dict."""
    def _make(**overrides):
        _, admin_headers = register_admin()
        payload = {
            "title": "Test Sedan", "make": "Toyota", "model": "Corolla", "year": 2020,
            "category": "Sedan", "location": "Lahore", "rental_price": 5000,
            "transmission": "Automatic", "fuel_type": "Petrol",
        }
        payload.update(overrides)
        res = client.post("/vehicles", json=payload, headers=admin_headers)
        assert res.status_code == 201, res.text
        vehicle = res.json()
        approve = client.put(f"/vehicles/{vehicle['id']}", json={"status": "APPROVED"}, headers=admin_headers)
        assert approve.status_code == 200, approve.text
        return approve.json()
    return _make

@pytest.fixture
def make_tour(client, register_admin):
    """Creates a tour. Tours go ACTIVE immediately on creation (no separate approval step, unlike vehicles)."""
    def _make(**overrides):
        _, admin_headers = register_admin()
        payload = {
            "tour_type": "GROUP_BUS", "title": "Test Tour", "destination": "Hunza Valley",
            "duration_days": 3, "price": 10000, "max_group_size": 20,
        }
        payload.update(overrides)
        res = client.post("/tours", json=payload, headers=admin_headers)
        assert res.status_code == 201, res.text
        return res.json()
    return _make