from fastapi import APIRouter

from app.api.v1 import (
    admin,
    consent,
    events,
    health,
    internal,
    links,
    players,
    push,
    registrations,
    teams,
    uploads,
    venues,
    webhooks,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(admin.router)
api_router.include_router(internal.router)
api_router.include_router(consent.router)
api_router.include_router(venues.router)
api_router.include_router(players.router)
api_router.include_router(events.router)
api_router.include_router(registrations.router)
api_router.include_router(teams.router)
api_router.include_router(uploads.router)
api_router.include_router(push.router)
api_router.include_router(webhooks.router)
# Registered last: its /events/{id}/motm path must not shadow the event routes.
api_router.include_router(links.router)
