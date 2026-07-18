"""Terms acceptance routes.

`GET /terms/status` lets the client decide whether to prompt without hardcoding
the version in the frontend, so bumping `CURRENT_TERMS_VERSION` re-prompts
everyone without a frontend deploy.
"""

from fastapi import APIRouter, Query

from app.dependencies import SessionDep
from app.models import CURRENT_TERMS_VERSION
from app.schemas.consent import ConsentCreate, ConsentRead, TermsStatus
from app.services import consent_service

router = APIRouter(prefix="/terms", tags=["terms"])


@router.get("/status", response_model=TermsStatus)
async def terms_status(session: SessionDep, display_name: str = Query(default="")):
    """Report the current terms version and whether this name has accepted it."""
    name = display_name.strip()
    accepted = bool(name) and await consent_service.has_accepted(
        session, name, CURRENT_TERMS_VERSION
    )
    return TermsStatus(current_version=CURRENT_TERMS_VERSION, accepted=accepted)


@router.post("/accept", response_model=ConsentRead, status_code=201)
async def accept_terms(payload: ConsentCreate, session: SessionDep):
    return await consent_service.accept_terms(session, payload)
