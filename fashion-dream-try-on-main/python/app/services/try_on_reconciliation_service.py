"""Provider-to-database reconciliation for AI Try-On jobs.

The reconciliation logic is intentionally separate from the HTTP layer so the
same operation can be invoked by authenticated API requests or by an internal
server-side worker/bridge.
"""

from typing import Any

from app.models.try_on import TryOnJob, TryOnStatus
from app.services.fashn_provider import FashnProviderError
from app.services.fashn_vton_provider import FashnVtonProviderError
from app.services.replicate_provider import ReplicateProviderError
from app.services.try_on_job_service import TryOnJobContext, TryOnJobService
from app.services.try_on_service import TryOnService
from app.services.try_on_storage_service import TryOnStorageError, TryOnStorageService


def _map_provider_status(provider_status: str) -> TryOnStatus | None:
    """Map an external provider lifecycle status to the internal job status."""

    return {
        "starting": TryOnStatus.PROCESSING,
        "in_queue": TryOnStatus.PROCESSING,
        "queued": TryOnStatus.QUEUED,
        "processing": TryOnStatus.PROCESSING,
        "completed": TryOnStatus.COMPLETED,
        "succeeded": TryOnStatus.COMPLETED,
        "failed": TryOnStatus.FAILED,
        "canceled": TryOnStatus.FAILED,
        "cancelled": TryOnStatus.FAILED,
    }.get(provider_status.strip().lower())


class TryOnReconciliationService:
    """Synchronize a persisted Try-On job with its external provider."""

    def __init__(self, job_service: TryOnJobService, provider_service: TryOnService, storage_service: TryOnStorageService) -> None:
        self.job_service = job_service
        self.provider_service = provider_service
        self.storage_service = storage_service

    def refresh(self, context: TryOnJobContext, *, user_id: str | None = None, internal: bool = False) -> TryOnJob:
        """Fetch provider state and persist the resulting job lifecycle state."""
        if not internal and not user_id:
            raise ValueError("user_id is required for authenticated reconciliation")

        job = context.job
        prediction_id = context.metadata.get("provider_prediction_id")
        if not isinstance(prediction_id, str) or not prediction_id.strip():
            return job

        try:
            provider = self.provider_service.provider_for_name(job.provider)
            payload = provider.get_status(prediction_id)
        except ValueError as exc:
            return self._fail(job.id, str(exc), user_id=user_id, internal=internal)
        except (FashnProviderError, FashnVtonProviderError, ReplicateProviderError) as exc:
            failed = self._update_status(job.id, status=TryOnStatus.FAILED, error=str(exc), user_id=user_id, internal=internal)
            return failed or job

        provider_status = str(payload.get("status", "")).strip().lower()
        if not provider_status:
            return self._fail(job.id, "Try-On provider returned an invalid status payload", user_id=user_id, internal=internal)

        mapped_status = _map_provider_status(provider_status)
        if mapped_status is None:
            if internal:
                return self._fail(job.id, "Try-On provider returned an invalid status", user_id=user_id, internal=internal)
            return job

        result_path: str | None = None
        if mapped_status == TryOnStatus.COMPLETED:
            result_path = self._persist_result(job.id, payload)
            if result_path is None:
                return self._fail(job.id, "Try-On provider completed without a valid output image", user_id=user_id, internal=internal)

        error = payload.get("error") if mapped_status == TryOnStatus.FAILED else None
        if mapped_status == TryOnStatus.FAILED and not error:
            error = "Try-On provider prediction failed"

        updated = self._update_status(
            job.id,
            status=mapped_status,
            result_image_path=result_path,
            error=str(error) if error else None,
            user_id=user_id,
            internal=internal,
        )
        return updated or job

    def _update_status(self, job_id: str, *, status: TryOnStatus, result_image_path: str | None = None, error: str | None = None, user_id: str | None, internal: bool) -> TryOnJob | None:
        if internal:
            return self.job_service.update_status_internal(job_id, status=status, result_image_path=result_image_path, error=error)
        return self.job_service.update_status(job_id, user_id=str(user_id), status=status, result_image_path=result_image_path, error=error)

    def _persist_result(self, job_id: str, payload: dict[str, Any]) -> str | None:
        output = payload.get("output")
        candidate = output[0] if isinstance(output, list) and output else output
        if not isinstance(candidate, str) or not candidate.strip():
            return None
        try:
            return self.storage_service.persist_provider_result(job_id, candidate.strip())
        except TryOnStorageError:
            return None

    def _fail(self, job_id: str, error: str, *, user_id: str | None, internal: bool) -> TryOnJob:
        failed = self._update_status(job_id, status=TryOnStatus.FAILED, error=error, user_id=user_id, internal=internal)
        if failed is None:
            raise RuntimeError(error)
        return failed
