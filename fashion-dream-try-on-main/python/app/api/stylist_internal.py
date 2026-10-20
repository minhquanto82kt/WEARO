"""Internal AI Stylist bridge for same-origin TanStack server functions."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.rate_limit import (
    RECOMMENDATION_REQUESTS,
    RECOMMENDATION_WINDOW_SECONDS,
    RateLimitExceeded,
    ai_rate_limiter,
)
from app.models.stylist import StylistRequest, StylistResult
from app.services.stylist_service import StylistService

router = APIRouter(prefix="/api/stylist/internal", tags=["stylist-internal"])
stylist_service = StylistService()


class InternalStylistRequest(BaseModel):
    """Input accepted only by the trusted server-side application bridge."""

    occasion: str | None = Field(default=None, max_length=100)
    mood: str | None = Field(default=None, max_length=100)
    preferences: dict[str, Any] = Field(default_factory=dict)
    limit: int = Field(default=4, ge=1, le=8)
    client_key: str = Field(default="unknown", min_length=1, max_length=200)


def _require_internal_secret(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Allow only the server-side application bridge to call this API."""

    settings = get_settings()
    expected = (settings.supabase_service_role_key or settings.supabase_secret_key).strip()
    supplied = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else ""
    if not expected or not supplied or supplied != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal authentication required",
        )


@router.post(
    "/recommend",
    response_model=StylistResult,
    dependencies=[Depends(_require_internal_secret)],
)
def internal_stylist_recommend(request: InternalStylistRequest) -> StylistResult:
    """Return real catalog recommendations for the trusted web application bridge."""

    try:
        ai_rate_limiter.check(
            request.client_key,
            RECOMMENDATION_REQUESTS,
            RECOMMENDATION_WINDOW_SECONDS,
        )
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many stylist requests. Please wait before trying again.",
            headers={"Retry-After": str(RECOMMENDATION_WINDOW_SECONDS)},
        ) from exc

    return stylist_service.recommend(
        StylistRequest(
            occasion=request.occasion,
            mood=request.mood,
            preferences=request.preferences,
            limit=request.limit,
        )
    )
