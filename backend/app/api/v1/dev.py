from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.dependencies import SessionDep
from app.services.dev_seed_service import seed_full_event

router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/seed/full-event")
async def seed_full_demo_event(session: SessionDep) -> dict[str, str]:
    if get_settings().environment != "development":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return await seed_full_event(session)
