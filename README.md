# Footbolski

A mobile-first coordination app for a private recreational football group. Handles everything from scheduling sessions and managing registrations to AI-powered team splitting and live formation editing.

> Hosted on a personal homeserver. Infrastructure (backend, frontend, database, object storage) is managed with [Coolify](https://coolify.io).

---

https://github.com/user-attachments/assets/6f5f9d99-40d6-4831-8edd-f702bd5f726d



## Features

### Sessions & Identity
Players identify themselves by entering a display name on first visit. The name is stored in `localStorage` and matched against the player roster so the app can personalise the UI (e.g. highlighting your own registration, showing your player card).

### Events
- Create upcoming matches with date, time, venue, and maximum player count
- View all past and upcoming events in a list
- Cancel an event (removes it from the active view)
- Each event has a dedicated detail page

### Registration & Waitlist
- Players join or leave an event with one tap
- Registrations beyond the venue's capacity go automatically onto a waitlist
- Waitlisted players are promoted in order when a spot opens
- Guest players (friends not in the main roster) can be added by name
- Guests can be given a full attribute profile (ratings, position, role) to inform the AI split

### Player Roster
- Persistent player cards for the regular group
- Each card shows: position, overall skill rating bar, attribute tags, age, height, and individual stat bars (speed, technique, defending, shooting, stamina, work rate)
- Add, edit, or delete player cards from the UI
- Upload a player photo (stored in MinIO object storage)
- Full attribute editing: age, height, preferred role, and 7 rated stats (1–10 sliders)

### AI Team Splitting
- One-tap team generation powered by the **Claude** API (Anthropic)
- The AI balances teams across overall skill, positional distribution, physical/aerial strength, and work rate
- Falls back to an algorithmic snake-draft if the Claude API is unavailable
- Swap suggestions included in the AI response
- Teams can be re-split at any time

### Formation & Pitch View
- Drag-and-drop formation editor on an interactive pitch canvas
- Multiple formation presets available
- Player tokens positioned on the pitch in real time
- Shareable pitch view via a dedicated page

### Payments
- Track who has paid for a session directly from the event page
- Payment status shown inline on the registration list

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | FastAPI, SQLAlchemy (async), Alembic, asyncpg |
| Database | PostgreSQL |
| Object Storage | MinIO |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Hosting | Self-hosted homeserver via Coolify |

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- Access to the remote PostgreSQL and MinIO instances (or local Docker alternatives)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5174`. The API base URL defaults to `http://localhost:8000/api/v1`. Override with `VITE_API_BASE_URL` in a `.env.local` file.

### Backend

```bash
cd backend
uv sync
# edit .env with your DATABASE_URL and other settings
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On first startup the app seeds venues and players into an empty database automatically.

### Environment variables (backend `.env`)

```dotenv
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<db>
MINIO_ENDPOINT=<host>:<port>
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=footbolski-media
MINIO_PUBLIC_URL=https://media.example.com
CORS_ORIGINS=http://localhost:5174
ENVIRONMENT=development
CLAUDE_API_KEY=sk-ant-...
```

---

## Deployment (Coolify)

Two applications deployed from the same repository on a self-hosted Coolify instance:

| App | Base directory | Port | Notes |
|---|---|---|---|
| Frontend | `/frontend` | `3000` | Set `VITE_API_BASE_URL` to the public backend URL + `/api/v1` |
| Backend | `/backend` | `8000` | Set all env vars above; Alembic migrations run automatically on deploy |

PostgreSQL and MinIO run as separate Coolify-managed services on the same homeserver.
