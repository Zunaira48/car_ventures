# Deployment Guide — car_ventures

This project deploys as two separate services against the existing Neon PostgreSQL database:

- **Backend** (FastAPI) → [Render](https://render.com), as a Python web service
- **Frontend** (React/Vite) → [Vercel](https://vercel.com), as a static Vite site

Both platforms deploy straight from this GitHub repo. Because the backend needs a public URL before the frontend can point at it, **deploy the backend first.**

## What's already in place (no code changes needed)

Checked before writing this guide — these are already deployment-ready:

- `backend/app/config.py` reads `DATABASE_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `ADMIN_EMAIL` from environment variables (via `.env` locally, via platform env vars in production) — nothing hardcoded.
- `backend/app/main.py` has `/health` and `/health/db` endpoints, and CORS origins are read from `CORS_ORIGINS` (comma-separated) rather than hardcoded to `localhost`.
- Database schema is entirely Alembic-migration-driven (no `Base.metadata.create_all()` anywhere), so `alembic upgrade head` is the single source of truth for schema state in any environment.
- The AI price-prediction model (`backend/app/ml/price_model.joblib`) and all tour/vehicle placeholder images (`frontend/public/images/*.jpg`) are committed to git — confirmed via `git ls-files`, not gitignored. Neither will 404 in production.
- `backend/.env.example` and `frontend/.env.example` already list every required variable.

## Part 1 — Backend on Render

### Option A: Blueprint (uses `backend/render.yaml`, recommended)

1. Go to the [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect the `car_ventures` GitHub repo and select the `main` branch.
3. Render will detect `backend/render.yaml` and show the `car-ventures-api` service it defines.
4. You'll be prompted to fill in values for the four environment variables the Blueprint deliberately leaves blank (`sync: false` — secrets are never written into the YAML file itself):
   - `DATABASE_URL` — your existing Neon connection string (the same one in your local `backend/.env`)
   - `CORS_ORIGINS` — set to `http://localhost:5173` for now; you'll update this to your real Vercel URL in Part 3
   - `JWT_SECRET` — your existing production secret (**not** the placeholder from `.env.example`)
   - `ADMIN_EMAIL` — your admin email
5. Click **Apply**. Render will run `pip install -r requirements.txt`, then `alembic upgrade head` against your Neon database, then start the service with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### Option B: Manual Web Service (if you'd rather not use a Blueprint)

1. **New** → **Web Service** → connect the repo.
2. **Root Directory**: `backend`
3. **Runtime**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Pre-Deploy Command**: `alembic upgrade head`
6. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. **Health Check Path**: `/health`
8. Add the same 4 environment variables listed above under the service's **Environment** tab.

### After it deploys

- Render gives you a URL like `https://car-ventures-api.onrender.com`. **Copy it** — you need it for Part 2.
- Verify it's actually working before moving on: