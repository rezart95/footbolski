# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Footbolski is a mobile-first PWA for a private recreational football group (~20 people). It handles event scheduling, player registration with waitlist, payment tracking, AI-powered team splitting (Claude API), drag-and-drop formation editing, and push/SMS reminders. No authentication — identity is a name stored in localStorage.

Deployed on a self-hosted homeserver (a laptop) via Coolify. All infrastructure is Coolify-managed — no local database or services run on the development machine.

## Development Commands

### Frontend (from `frontend/`)
```bash
npm install
npm run dev          # Vite dev server at http://localhost:5174
npm run build        # tsc && vite build
npx tsc --noEmit     # type-check without emitting
```

### Backend (from `backend/`)
```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alembic migrations are **not run locally**. They run automatically on deploy via Coolify (`uv run alembic upgrade head` in the nixpacks start command).

### No tests
This project has no test suite. There are no test files or test directories.

## Architecture

### Frontend (`frontend/src/`)
- **React 18 + TypeScript + Vite + Tailwind CSS** PWA with service worker (`sw.ts`)
- **Routing**: React Router v6 — routes defined in `main.tsx`
  - `/` → HomePage (next upcoming event), `/events` → list, `/events/:id` → detail, `/pitch` → formation editor, `/players` → player cards
- **Server state**: TanStack Query with 15s polling (`refetchInterval`) — no WebSockets
- **Client state**: Zustand for session name only (`store/session.store.ts`)
- **HTTP**: All API calls go through the shared Axios instance in `lib/axios.ts` (base URL from `VITE_API_BASE_URL` env var, defaults to `http://localhost:8000/api/v1`)
- **Services layer**: `services/*.service.ts` wrap Axios calls; hooks in `hooks/` wrap services with TanStack Query
- **UI components**: `components/ui/` for primitives (Button, Modal, Field, etc.), `components/features/` for domain components, `components/layout/` for AppShell/TopBar/BottomNav
- **Design**: Dark pitch theme — base colors `#0A1A0F`/`#111D14`, accent `#3DDB6A`. Custom color scale under `pitch-*` in Tailwind config. Fonts: Space Grotesk (headings), Inter (body)

### Backend (`backend/app/`)
- **FastAPI + async SQLAlchemy 2.x + asyncpg + Alembic**
- **API routes**: `api/v1/router.py` aggregates all route modules — health, venues, players, events, registrations, teams, uploads, push
- **Dependency injection**: `SessionDep` (annotated async session) in `dependencies.py`
- **Service layer**: Business logic in `services/` — route handlers are thin, services do the work
- **Models**: SQLAlchemy models in `models/`, Pydantic schemas in `schemas/`
- **Config**: pydantic-settings in `core/config.py`, reads from `backend/.env`
- **Database URL** uses `postgresql+asyncpg://` (async driver)
- **Seeding**: `core/seed.py` seeds venues and players on startup (idempotent)
- **Migrations**: Alembic in `backend/alembic/`, sequential numbering (`0001_`, `0002_`, ...)

### AI Team Splitting (`backend/app/agent/`)
- `agent_router.py`: Calls Claude API directly via the `anthropic` SDK to split players into balanced teams
- `prompts.py`: System prompt instructing Claude to balance teams by skill, stamina, position, goalkeeper rotation, and physical attributes
- `tools.py`: Placeholder for future LangGraph tools
- Called internally by `POST /api/v1/events/:id/teams/generate` — not exposed as a chat interface
- Falls back to algorithmic snake-draft in `services/team_service.py` if Claude API is unavailable

### Push Notifications & Reminders
- **Web Push (VAPID)** via `pywebpush` — subscriptions stored in `push_subscriptions` table
- **SMS** via Twilio — max 2 per player per event, configurable cooldown
- `services/notification_service.py`: send_push() and send_sms()
- `services/reminder_service.py`: Reminder logic with cooldown enforcement
- Frontend service worker (`sw.ts`) handles incoming push events

## Key Patterns

- **No auth**: Identity is `session_name` in localStorage. Creator permissions (cancel event, split teams) are validated server-side by matching `session_name` against `event.created_by_name` (case-insensitive)
- **Optimistic updates**: Payment toggles and registration use TanStack Query mutations with optimistic UI
- **Waitlist auto-promotion**: When a confirmed player leaves, the first waitlisted player is promoted automatically (server-side in `registration_service.py`)
- **Event lifecycle**: Events are `upcoming` → `completed` (auto-transition 90 min after kickoff) or `cancelled` (manual by creator)
- **Player-registration linking**: Creating/updating a player card back-fills `player_id` on existing registrations matched by name

## Environment Variables

Frontend uses `VITE_API_BASE_URL` (set in `.env.local`, not committed).

Backend reads all config from `backend/.env`. Key variables: `DATABASE_URL`, `CLAUDE_API_KEY`, `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, `TWILIO_*`, `MINIO_*`, `CORS_ORIGINS`. Full list in `backend/app/core/config.py`.

## Deployment

All infrastructure is on a single homeserver managed by Coolify. Deployments happen via git push — Coolify builds and deploys automatically.

| Coolify Resource | Type | URL |
|---|---|---|
| footbolski-frontend | Application | http://footbolski.org |
| footbolski-backend | Application | http://api.footbolski.org |
| footbolski-db | Database (PostgreSQL) | internal |
| minio | Service | internal |

Backend nixpacks start command runs `alembic upgrade head` before starting uvicorn, so migrations apply automatically on every deploy. New migration files are created locally with `uv run alembic revision --autogenerate -m "description"` but only executed on the server.
