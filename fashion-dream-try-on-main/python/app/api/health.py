"""Health-check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["system"])


@router.get("/api/health")
@router.get("/health")
def health_check() -> dict[str, str]:
    """Return a lightweight service health response."""

    return {"status": "ok", "service": "upthink-python"}
