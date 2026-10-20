"""AI Try-On job endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.rate_limit import (
    TRY_ON_REQUESTS,
    TRY_ON_WINDOW_SECONDS,
    RateLimitExceeded,
    ai_rate_limiter,
)
from app.models.try_on import TryOnJob, TryOnRequest, TryOnStatus
from app.services.fashn_provider import FashnProviderError
from app.services.fashn_vton_provider import FashnVtonProviderError
from app.services.replicate_provider import ReplicateProviderError
from app.services.try_on_job_service import TryOnJobService
from app.services.try_on_reconciliation_service import TryOnReconciliationService
from app.services.try_on_service import TryOnService
from app.services.try_on_storage_service import TryOnStorageError, TryOnStorageService

router = APIRouter(prefix="/api/try-on", tags=["try-on"])
job_service = TryOnJobService()
provider_service = TryOnService()
storage_service = TryOnStorageService()
reconciliation_service = TryOnReconciliationService(
    job_service,
    provider_service,
    storage_service,
)


@router.post("/jobs", response_model=TryOnJob, status_code=202)
def create_try_on_job(
    request: TryOnRequest,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> TryOnJob:
    """Create and persist a try-on job owned by the authenticated user."""

    user_id = str(user["id"])
    try:
        ai_rate_limiter.check(user_id, TRY_ON_REQUESTS, TRY_ON_WINDOW_SECONDS)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many Try-On requests. Please wait before trying again.",
            headers={"Retry-After": str(TRY_ON_WINDOW_SECONDS)},
        ) from exc

    try:
        job, submission = provider_service.create_job(request)
        metadata = dict(request.metadata)
        if submission.prediction_id:
            metadata["provider_prediction_id"] = submission.prediction_id
        return job_service.create_job(
            request,
            user_id=user_id,
            provider=job.provider,
            job_id=job.id,
            status=job.status,
            error=job.error,
            metadata=metadata,
        )
    except (FashnProviderError, FashnVtonProviderError, ReplicateProviderError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get("/jobs/{job_id}", response_model=TryOnJob)
def get_try_on_job(
    job_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> TryOnJob:
    """Return the latest state of a user's try-on job.

    Provider reconciliation lives in a dedicated service so the same state
    transition can later be invoked by a worker without moving HTTP logic.
    """

    user_id = str(user["id"])
    context = job_service.get_job_context(job_id, user_id=user_id)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Try-on job not found",
        )

    job = context.job
    if job.status in (TryOnStatus.COMPLETED, TryOnStatus.FAILED):
        return _with_signed_result(job) if job.status == TryOnStatus.COMPLETED else job

    job = reconciliation_service.refresh(context, user_id=user_id)
    return _with_signed_result(job) if job.status == TryOnStatus.COMPLETED else job


def _with_signed_result(job: TryOnJob) -> TryOnJob:
    """Expose a short-lived signed URL for a private stored result."""
    if not job.result_image_url:
        return job
    try:
        signed_url = storage_service.create_signed_url(job.result_image_url)
    except TryOnStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return job.model_copy(update={"result_image_url": signed_url})
