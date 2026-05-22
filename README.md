# Pitchup

Mobile-first coordination app for a private recreational football group.

Current implementation includes Phase 1 frontend and Phase 2 backend. The AI team splitting agent remains a Phase 3 placeholder.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5174` for local development.

The frontend expects the API at `http://localhost:8000/api/v1` by default. Override it with `VITE_API_BASE_URL`.

## Backend

```bash
cd backend
uv sync
copy .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The backend seeds the two read-only venues on startup.
