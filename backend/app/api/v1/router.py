from fastapi import APIRouter

from app.api.v1 import events, health, players, push, registrations, teams, uploads, venues

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(venues.router)
api_router.include_router(players.router)
api_router.include_router(events.router)
api_router.include_router(registrations.router)
api_router.include_router(teams.router)
api_router.include_router(uploads.router)
api_router.include_router(push.router)
