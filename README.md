# Footbolski

A mobile-first coordination app for a private recreational football group. Handles event scheduling, player registration, AI-powered team splitting, formation editing, payment tracking, and push/SMS reminders.

> Self-hosted on a personal homeserver. Infrastructure managed with [Coolify](https://coolify.io).

---

https://github.com/user-attachments/assets/6f5f9d99-40d6-4831-8edd-f702bd5f726d

---

## Features

### Identity & Sessions
- Name entered once on first visit, stored in `localStorage`
- Auto-matched to a player card by name (exact or first-word match)
- Personalises the UI: highlights your registration, shows your player card, reveals organiser controls

### Events
- Create a match with venue, date, time, and max player count
- Each creator is limited to one event per calendar day
- Events transition automatically to **completed** 90 minutes after kick-off
- Creator can **cancel** an event (with confirmation) — all registered players receive a push notification
- Cancelled events can be **deleted** by the creator
- Push notification sent to all subscribers when a new event is created
- Smart "upcoming event" view always shows the next relevant match on the home screen
- Paginated event list with status filtering (`upcoming` / `cancelled` / `completed`)

### Registration & Waitlist
- Join or leave any upcoming event from the event detail page or home screen
- Registrations beyond `max_players` go to a **waitlist** automatically
- When a confirmed player leaves, the first waitlisted player is promoted immediately
- **Guest players**: add a friend by name without a player card; the organiser can attach a full attribute profile to a guest to inform the AI split
- Display names are unique per event
- Registration positions are resequenced automatically after any change

### Player Roster
- Persistent player cards for the regular group
- **Per-player data**: name, age, height, build, preferred role, position (GK / DEF / MID / ATT), overall skill rating, 7 performance stats (speed, technique, defending, shooting, aerial, stamina, work rate), attribute tags, notes, phone number
- Photo upload stored in MinIO object storage
- Creating or updating a player card automatically back-fills `player_id` on any existing registrations that matched by name

### AI Team Splitting
- One-tap team generation using the **Claude** API (Anthropic)
- Available only to the event creator once the confirmed list is full
- Balances teams across: overall composite score, positional distribution (GK / DEF / MID / ATT mix), aerial and physical strength, speed, and player notes
- Response includes team assignments, a short reasoning summary, and 1–2 suggested swaps
- Reasoning and swap options are stored on the event and displayed in the AI Insights panel
- Algorithmic snake-draft fallback if the Claude API is unavailable

### Formation & Pitch View
- Drag-and-drop formation editor on an interactive pitch canvas
- Formation presets auto-generated from the venue's `players_per_side` (e.g. 4-3-3, 4-4-2)
- Player tokens show initials and first name, positioned at X/Y coordinates (0–100%)
- Only the event creator can edit; all other users see a read-only view
- Formation and positions are persisted and visible on the dedicated Pitch page

### Payments
- Toggle paid / unpaid per player directly from the event page
- `paid_at` timestamp recorded on each change
- Paid players shown in green; unpaid players highlighted for reminders

### Reminders
- **Push notifications**: VAPID-based Web Push via `pywebpush`
  - First-visit modal prompts users to enable notifications
  - Persistent banner and subtle icon shown until permission is granted or dismissed
  - Auto-subscribes on every page load until the backend confirms the subscription is saved (handles the case where a player card didn't exist yet)
  - Subscription stored per device; dead subscriptions (410 / 404) are removed automatically
- **SMS**: Twilio-based (max 2 SMS per player per event)
- Reminders can only be sent to players with a linked player card
- Cooldown between reminders is configurable via `REMINDER_COOLDOWN_MINUTES`
- Full reminder history logged per registration (channel, status, detail, sent by)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, dnd-kit |
| Backend | FastAPI, SQLAlchemy (async), Alembic, asyncpg |
| Database | PostgreSQL |
| Object storage | MinIO |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Push notifications | Web Push (VAPID) via pywebpush |
| SMS | Twilio |
| Hosting | Self-hosted homeserver via Coolify |

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- Access to a PostgreSQL instance and MinIO (or local Docker alternatives)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5174`. Override the API URL with `VITE_API_BASE_URL` in a `.env.local` file.

### Backend

```bash
cd backend
uv sync
# configure .env (see below)
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Venues and players are seeded automatically on first startup against an empty database.

### Backend environment variables

```dotenv
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<db>

MINIO_ENDPOINT=<host>:<port>
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=footbolski-media
MINIO_PUBLIC_URL=https://media.example.com

CORS_ORIGINS=http://localhost:5174
ENVIRONMENT=development
APP_PUBLIC_URL=http://localhost:5174

CLAUDE_API_KEY=sk-ant-...

# VAPID — generate with pywebpush or py-vapid
VAPID_PUBLIC_KEY=<base64url public key>
VAPID_PRIVATE_KEY=<base64url raw private key>
VAPID_SUBJECT=mailto:you@example.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Reminder policy
REMINDER_COOLDOWN_MINUTES=10   # set to 0 to disable during testing
SMS_MAX_PER_EVENT=2
DEFAULT_PHONE_REGION=PL
```

---

## Deployment (Coolify)

Two applications deployed from the same repository:

| App | Base directory | Port | Notes |
|---|---|---|---|
| Frontend | `/frontend` | `3000` | Set `VITE_API_BASE_URL` to the public backend URL + `/api/v1` |
| Backend | `/backend` | `8000` | Set all env vars above; Alembic migrations run automatically on deploy |

PostgreSQL and MinIO run as separate Coolify-managed services on the same homeserver.

### Generating VAPID keys

```python
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PrivateFormat, NoEncryption
from py_vapid import Vapid
import base64

v = Vapid()
v.generate_keys()

# Public key (set as VAPID_PUBLIC_KEY)
pub = v.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
print(base64.urlsafe_b64encode(pub).rstrip(b'=').decode())

# Private key (set as VAPID_PRIVATE_KEY) — raw base64url, single line, no PEM headers
priv_int = v.private_key.private_numbers().private_value
print(base64.urlsafe_b64encode(priv_int.to_bytes(32, 'big')).rstrip(b'=').decode())
```

