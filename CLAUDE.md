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

Alembic migrations are **not run locally**. They run automatically on deploy via Coolify — the backend `Dockerfile` `CMD` is `alembic upgrade head && uvicorn app.main:app ...`.

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
- **Design**: Dark pitch theme — base colors `#0A1A0F`/`#111D14`, accent `#3DDB6A`. Custom color scale under `pitch-*` in Tailwind config. Fonts: Space Grotesk (headings), Inter (body). Layout respects iOS safe-area insets (`env(safe-area-inset-*)`) for standalone mode
- **PWA install**: Icons in `public/icons/` (regular + maskable + apple-touch-icon), manifest in `vite.config.ts` (the linked one) and `public/manifest.json`. `components/features/pwa/InstallBanner.tsx` (hook `usePwaInstall`) shows a **non-dismissible** install banner until the app is installed — native prompt on Android/Chrome, Share→Add-to-Home-Screen instructions on iOS. After install (standalone), `NotificationPrompt.tsx` (hook `usePushOptIn`) asks the user to enable push. The service worker (`sw.ts`) also does app-shell fallback for offline navigations and network-first caching for `/api/` GETs; `components/layout/OfflineIndicator.tsx` shows an offline pill. The SW is enabled in dev via `devOptions` so install/push can be tested locally
- **Maps**: `lib/maps.ts` `mapsUrl()` builds an address link that opens Apple Maps on iOS and Google Maps elsewhere. Venue names/addresses on event cards and detail pages are tappable maps links

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
- **Opt-in**: `lib/push.ts` `enablePushForUser()` subscribes the browser and binds it to a display name. It's triggered by `NotificationPrompt.tsx`, shown only once the app is installed (standalone). **iOS only allows Web Push for installed PWAs (16.4+)** — a Safari tab cannot receive push. Push also requires HTTPS and `VAPID_*` keys set in the backend env, or `send_push` no-ops

## Key Patterns

- **No auth**: Identity is `session_name` in localStorage. Creator permissions (cancel event, split teams) are validated server-side by matching `session_name` against `event.created_by_name` (case-insensitive)
- **Optimistic updates**: Payment toggles and registration use TanStack Query mutations with optimistic UI
- **Waitlist auto-promotion**: When a confirmed player leaves, the first waitlisted player is promoted automatically (server-side in `registration_service.py`)
- **Event lifecycle**: Events are `upcoming` → `completed` (auto-transition 90 min after kickoff) or `cancelled` (manual by creator)
- **Player-registration linking**: Creating/updating a player card back-fills `player_id` on existing registrations matched by name
- **Payment info**: Events carry `price_per_person`, `pay_to_name`, and `payment_method` (`blik`/`revolut`/`bank_transfer`, stored as a plain string, labels in `PAYMENT_METHOD_LABELS`). Set on the create-event form, shown on cards and the detail page

## Environment Variables

Frontend uses `VITE_API_BASE_URL` (set in `.env.local`, not committed).

Backend reads all config from `backend/.env`. Key variables: `DATABASE_URL`, `CLAUDE_API_KEY`, `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, `TWILIO_*`, `MINIO_*`, `CORS_ORIGINS`. Full list in `backend/app/core/config.py`.

## Deployment

All infrastructure is on a single homeserver managed by Coolify. Deployments happen via git push — Coolify builds and deploys automatically.

A **Coolify MCP server** (`@masonator/coolify-mcp`) is configured in `.mcp.json` for inspecting/managing Coolify resources from Claude Code. Its `COOLIFY_ACCESS_TOKEN` and `COOLIFY_BASE_URL` are read from env vars set in the gitignored `.claude/settings.local.json` — never commit the token. The Coolify dashboard/API is at `http://192.168.0.107:8000` (LAN), API version 4.0.0.

| Coolify Resource | Type | URL |
|---|---|---|
| footbolski-frontend | Application | https://footbolski.org |
| footbolski-backend | Application | https://api.footbolski.org |
| footbolski-db | Database (PostgreSQL) | internal — LAN `192.168.0.107:5434` |
| minio | Service | internal |

Backend nixpacks start command runs `alembic upgrade head` before starting uvicorn, so migrations apply automatically on every deploy. New migration files are created locally with `uv run alembic revision --autogenerate -m "description"` but only executed on the server.

### Cloudflare / DNS

The `footbolski.org` domain is managed on Cloudflare (Free plan). Public traffic is **proxied** (orange-cloud) through Cloudflare's edge, which terminates HTTPS and fronts the homeserver — this is why the app is on HTTPS even though Coolify serves the origin over LAN HTTP.

| Field | Value |
|---|---|
| Zone | `footbolski.org` |
| Zone ID | `f1efbb9ba3bbe30e2bf739115a26a77d` |
| Account | Rezart392@gmail.com's Account |
| Account ID | `0407a6d1691ae97ae49fe6da1327c174` |
| Status / Plan | active / Free Website |
| Nameservers | `coraline.ns.cloudflare.com`, `matias.ns.cloudflare.com` |
| Proxied hostnames | `footbolski.org`, `api.footbolski.org` (resolve to Cloudflare IPs `188.114.96.11` / `188.114.97.11`) |
| `www` | no record |

The origin is almost certainly reached via a **Cloudflare Tunnel** (proxied hostnames + a homeserver behind NAT), but the tunnel ID/name and the underlying DNS records could not be read: the Composio Cloudflare connection's `LIST_DNS_RECORDS`/`LIST_ACCOUNTS` calls fail with auth errors (code 9106 / "Invalid format for X-Auth-Key header") while `LIST_ZONES` succeeds. To read DNS/tunnel details, reconnect Cloudflare in Composio using an **API Token** (Bearer auth) with `Zone.DNS:Read` (and `Account > Cloudflare Tunnel:Read` for tunnels), not a legacy Global API Key.
