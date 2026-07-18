"""Shared FastAPI dependencies: the request-scoped DB session and the
shared-secret guard used by the admin and scheduler routes.

This app has no user authentication — identity is a name in localStorage — so
anything that must not be publicly callable is protected by `internal_api_secret`
alone. The guard fails closed: if the secret is not configured, every guarded
route refuses rather than falling open.
"""

import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session

SessionDep = Annotated[AsyncSession, Depends(get_session)]

INTERNAL_SECRET_HEADER = "X-Internal-Secret"


async def require_internal_secret(
    x_internal_secret: Annotated[str | None, Header(alias=INTERNAL_SECRET_HEADER)] = None,
) -> None:
    """Reject the request unless it carries the configured shared secret."""
    configured_secret = get_settings().internal_api_secret
    if not configured_secret:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Internal API is not configured on this server.",
        )
    presented_secret = x_internal_secret or ""
    if not secrets.compare_digest(presented_secret, configured_secret):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid internal secret.")


InternalSecretDep = Annotated[None, Depends(require_internal_secret)]
