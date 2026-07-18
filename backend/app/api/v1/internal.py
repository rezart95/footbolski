"""Operator endpoints behind the shared secret: the scheduler tick and its health.

The tick is triggered externally by a Coolify scheduled task rather than an
in-process timer, because the homeserver reboots and an in-process scheduler
would die with it without anyone noticing.
"""

from fastapi import APIRouter

from app.dependencies import InternalSecretDep, SessionDep
from app.services import scheduler_service

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/run-scheduler")
async def run_scheduler(session: SessionDep, _guard: InternalSecretDep):
    """Run one scheduler pass. Safe to call repeatedly; every action is guarded
    by a durable marker, so a double call sends nothing twice."""
    return await scheduler_service.run_tick(session)


@router.get("/scheduler-health")
async def scheduler_health(session: SessionDep, _guard: InternalSecretDep):
    """When the scheduler last completed a pass.

    A stale value is the only signal that the ladder has silently stopped, which
    otherwise looks exactly like a quiet week.
    """
    return {"last_successful_tick": await scheduler_service.last_tick_at(session)}
