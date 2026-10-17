"""Internal Try-On bridge and database-backed worker endpoints."""

from base64 import b64decode, binascii
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.rate_limit import TRY_ON_REQUESTS, TRY_ON_WINDOW_SECONDS, RateLimitExceeded, ai_rate_limiter
from app.models.try_on import TryOnCategory, TryOnJob, TryOnRequest, TryOnStatus
from app.services.fashn_provider import FashnProviderError
from app.services.fashn_vton_provider import FashnVtonProviderError
from app.services.image_service import normalize_image
from app.services.try_on_job_service import TryOnJobContext, TryOnJobService
from app.services.try_on_reconciliation_service import TryOnReconciliationService
from app.services.try_on_service import TryOnService
from app.services.try_on_storage_service import TryOnStorageError, TryOnStorageService
from app.services.try_on_worker_service import TryOnWorkerService

router = APIRouter(prefix="/api/try-on/internal", tags=["try-on-internal"])
job_service = TryOnJobService()
provider_service = TryOnService()
storage_service = TryOnStorageService()
reconciliation_service = TryOnReconciliationService(job_service, provider_service, storage_service)
worker_service = TryOnWorkerService(job_service, reconciliation_service)

# A shopper can resume polling after the first UI window; allow enough time for slow hosted jobs.
MAX_POLL_ATTEMPTS = 120
MAX_POLL_AGE_SECONDS = 10 * 60


class InternalTryOnInput(BaseModel):
    """Input accepted only by the trusted same-origin server bridge."""

    person_image: str = Field(min_length=20, max_length=8_500_000)
    garment_image_url: str = Field(min_length=1, max_length=4000)
    category: TryOnCategory = TryOnCategory.TOP
    note: str | None = Field(default=None, max_length=400)
    client_key: str = Field(default="unknown", min_length=1, max_length=200)


def _require_internal_secret(authorization: Annotated[str | None, Header()] = None) -> None:
    """Allow only the server-side application bridge to call this API."""
    expected = get_settings().supabase_service_role_key.strip()
    supplied = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else ""
    if not expected or not supplied or supplied != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Internal authentication required")


def _require_cron_secret(authorization: Annotated[str | None, Header()] = None) -> None:
    """Authorize scheduled worker calls with Vercel's CRON_SECRET."""
    expected = get_settings().cron_secret.strip()
    supplied = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else ""
    if not expected or not supplied or supplied != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Worker authentication required")


def _decode_data_url(data_url: str) -> tuple[bytes, str]:
    """Decode a browser image data URL into bytes and its declared MIME type."""
    prefix, separator, encoded = data_url.partition(",")
    if not separator or not prefix.startswith("data:image/") or ";base64" not in prefix:
        raise HTTPException(status_code=400, detail="Ảnh người dùng phải là data URL base64 hợp lệ")
    content_type = prefix[5:].split(";", 1)[0].lower()
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ JPG, PNG hoặc WEBP")
    try:
        return b64decode(encoded, validate=True), content_type
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="Dữ liệu ảnh không hợp lệ") from exc


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _poll_metadata(metadata: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Increment bounded polling metadata and reject stalled jobs."""
    updated = dict(metadata)
    attempts = int(updated.get("poll_attempts", 0)) + 1
    updated["poll_attempts"] = attempts
    updated["last_polled_at"] = _utc_now()
    started_at = updated.get("poll_started_at")
    if not isinstance(started_at, str) or not started_at.strip():
        started_at = _utc_now()
        updated["poll_started_at"] = started_at
    try:
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(started_at.replace("Z", "+00:00"))).total_seconds()
    except ValueError:
        age = MAX_POLL_AGE_SECONDS + 1
    if attempts > MAX_POLL_ATTEMPTS or age > MAX_POLL_AGE_SECONDS:
        raise TimeoutError("Try-On job exceeded the polling reliability limit")
    return updated, attempts


@router.post("/jobs", response_model=TryOnJob, status_code=202, dependencies=[Depends(_require_internal_secret)])
def create_internal_try_on_job(request: InternalTryOnInput) -> TryOnJob:
    """Persist the customer input, submit the provider job and return its initial state."""
    try:
        ai_rate_limiter.check(request.client_key, TRY_ON_REQUESTS, TRY_ON_WINDOW_SECONDS)
    except RateLimitExceeded as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many Try-On requests. Please wait before trying again.", headers={"Retry-After": str(TRY_ON_WINDOW_SECONDS)}) from exc

    if provider_service.provider.name == "stub":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI Try-On provider is not configured. Set TRY_ON_PROVIDER and the provider credentials on the server.")

    raw_data, content_type = _decode_data_url(request.person_image)
    try:
        normalized, _metadata = normalize_image(raw_data, content_type)
        person_path, person_url = storage_service.persist_input_image(normalized)
    except (ValueError, TryOnStorageError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        provider_request = TryOnRequest(person_image_url=person_url, garment_image_url=request.garment_image_url, category=request.category, metadata={"note": request.note} if request.note else {})
        job, submission = provider_service.create_job(provider_request)
        metadata: dict[str, Any] = {"person_image_path": person_path, "garment_image_url": request.garment_image_url, "poll_attempts": 0, "poll_started_at": _utc_now()}
        if request.note:
            metadata["note"] = request.note
        if submission.prediction_id:
            metadata["provider_prediction_id"] = submission.prediction_id
        return job_service.create_job(provider_request, user_id=None, provider=job.provider, job_id=job.id, status=job.status, error=job.error, metadata=metadata)
    except (FashnProviderError, FashnVtonProviderError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=TryOnJob, dependencies=[Depends(_require_internal_secret)])
def get_internal_try_on_job(job_id: str) -> TryOnJob:
    """Return the latest provider-backed state for the trusted server bridge."""
    context = job_service.get_job_context_internal(job_id)
    if context is None:
        raise HTTPException(status_code=404, detail="Try-on job not found")
    job = context.job
    if job.status in {TryOnStatus.COMPLETED, TryOnStatus.FAILED}:
        return _with_signed_result(job) if job.status == TryOnStatus.COMPLETED else job
    try:
        metadata, _attempts = _poll_metadata(context.metadata)
    except TimeoutError as exc:
        return _fail_internal_job(job_id, str(exc))
    prediction_id = metadata.get("provider_prediction_id")
    if not isinstance(prediction_id, str) or not prediction_id.strip():
        return _fail_internal_job(job_id, "Try-On job is missing the provider prediction ID")
    job_service.update_metadata_internal(job_id, metadata)
    updated = reconciliation_service.refresh(TryOnJobContext(job=job, metadata=metadata), internal=True)
    return _with_signed_result(updated) if updated.status == TryOnStatus.COMPLETED else updated


@router.post("/worker/reconcile", dependencies=[Depends(_require_cron_secret)])
def reconcile_pending_jobs(limit: int = 10) -> dict[str, Any]:
    """Run one bounded queue pass from Vercel Cron or another trusted scheduler."""
    return worker_service.run_once(limit=limit)


@router.get("/worker/metrics", dependencies=[Depends(_require_cron_secret)])
def worker_metrics() -> dict[str, Any]:
    """Return lightweight operational metrics derived from durable job state."""
    rows = job_service.list_metrics(limit=1000)
    by_status: dict[str, int] = {}
    by_provider: dict[str, int] = {}
    failures: list[dict[str, Any]] = []
    for row in rows:
        status_name = str(row.get("status", "unknown"))
        provider = str(row.get("provider", "unknown"))
        by_status[status_name] = by_status.get(status_name, 0) + 1
        by_provider[provider] = by_provider.get(provider, 0) + 1
        if status_name == "failed" and len(failures) < 20:
            failures.append({"provider": provider, "category": row.get("category"), "created_at": row.get("created_at"), "updated_at": row.get("updated_at"), "error": row.get("error")})
    total = len(rows)
    completed = by_status.get("completed", 0)
    return {
        "sample_size": total,
        "status": by_status,
        "provider": by_provider,
        "success_rate": round(completed / total, 4) if total else None,
        "recent_failures": failures,
    }


def _with_signed_result(job: TryOnJob) -> TryOnJob:
    if not job.result_image_url:
        return job
    try:
        signed_url = storage_service.create_signed_url(job.result_image_url)
    except TryOnStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return job.model_copy(update={"result_image_url": signed_url})


def _fail_internal_job(job_id: str, error: str) -> TryOnJob:
    failed = job_service.update_status_internal(job_id, status=TryOnStatus.FAILED, error=error)
    if failed is None:
        raise HTTPException(status_code=502, detail=error)
    return failed
