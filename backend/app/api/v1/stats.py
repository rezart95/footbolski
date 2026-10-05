from fastapi import APIRouter

from app.dependencies import SessionDep
from app.schemas.stats import PublicStats
from app.services import stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/public", response_model=PublicStats)
async def public_stats(session: SessionDep) -> PublicStats:
    return await stats_service.public_stats(session)
