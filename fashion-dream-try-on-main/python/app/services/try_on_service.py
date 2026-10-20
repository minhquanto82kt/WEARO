"""Provider abstraction and orchestration for AI Try-On."""

from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from app.core.config import get_settings
from app.models.try_on import TryOnJob, TryOnRequest, TryOnStatus
from app.services.fashn_provider import FashnPrediction, FashnProviderError, FashnTryOnProvider
from app.services.fashn_vton_provider import (
    FashnVtonLocalProvider as FashnVtonClient,
    FashnVtonProviderError,
)
from app.services.replicate_provider import ReplicateProviderError, ReplicateTryOnProvider


@dataclass(frozen=True)
class ProviderSubmission:
    """Provider-specific submission reference."""

    provider: str
    prediction_id: str | None = None


class TryOnProvider:
    """Provider contract used by the orchestration service."""

    name: str

    def submit(self, request: TryOnRequest) -> ProviderSubmission:
        """Submit a try-on request to this provider."""

        raise NotImplementedError

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        """Return the latest provider status for a submitted prediction."""

        raise NotImplementedError


class StubTryOnProvider(TryOnProvider):
    """Safe development provider; it never calls an AI model."""

    name = "stub"

    def submit(self, request: TryOnRequest) -> ProviderSubmission:
        return ProviderSubmission(provider=self.name)

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        return {"status": "queued"}


class FashnProviderAdapter(TryOnProvider):
    """Adapt the hosted FASHN provider to the domain contract."""

    def __init__(self, provider: FashnTryOnProvider | None = None) -> None:
        self.provider = provider or FashnTryOnProvider()
        self.name = self.provider.name

    def submit(self, request: TryOnRequest) -> ProviderSubmission:
        prediction: FashnPrediction = self.provider.submit(request)
        return ProviderSubmission(provider=self.name, prediction_id=prediction.id)

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        return self.provider.get_status(prediction_id)


class ReplicateProviderAdapter(TryOnProvider):
    """Adapt Replicate predictions to the shared Try-On job contract."""

    def __init__(self, provider: ReplicateTryOnProvider | None = None) -> None:
        self.provider = provider or ReplicateTryOnProvider()
        self.name = self.provider.name

    def submit(self, request: TryOnRequest) -> ProviderSubmission:
        prediction = self.provider.submit(request)
        return ProviderSubmission(provider=self.name, prediction_id=prediction.id)

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        return self.provider.get_status(prediction_id)


class FashnVtonLocalProvider(TryOnProvider):
    """Adapt the self-hosted FASHN VTON GPU service."""

    def __init__(self, provider: FashnVtonClient | None = None) -> None:
        self.provider = provider or FashnVtonClient()
        self.name = self.provider.name

    def submit(self, request: TryOnRequest) -> ProviderSubmission:
        submission = self.provider.submit(request)
        return ProviderSubmission(provider=self.name, prediction_id=submission.id)

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        return self.provider.get_status(prediction_id)


class TryOnService:
    """Orchestrate requests independently of the selected model/provider."""

    def __init__(self, provider: TryOnProvider | None = None) -> None:
        self.provider = provider or self._configured_provider()

    @staticmethod
    def provider_for_name(provider_name: str) -> TryOnProvider:
        """Construct a provider from the provider identifier persisted with a job."""

        normalized = provider_name.strip().lower()
        if normalized == "replicate":
            return ReplicateProviderAdapter()
        if normalized == "fashn-v1.6":
            return FashnProviderAdapter()
        if normalized == "fashn-vton-1.5":
            return FashnVtonLocalProvider()
        if normalized == "stub":
            return StubTryOnProvider()
        raise ValueError(f"Unsupported try-on provider: {provider_name}")

    @classmethod
    def _configured_provider(cls) -> TryOnProvider:
        provider_name = get_settings().try_on_provider.strip().lower()
        if provider_name == "fashn":
            return FashnProviderAdapter()
        if provider_name == "replicate":
            return ReplicateProviderAdapter()
        if provider_name == "fashn-local":
            return FashnVtonLocalProvider()
        return StubTryOnProvider()

    def create_job(self, request: TryOnRequest) -> tuple[TryOnJob, ProviderSubmission]:
        job_id = str(uuid4())
        try:
            submission = self.provider.submit(request)
        except (FashnProviderError, FashnVtonProviderError, ReplicateProviderError) as exc:
            return (
                TryOnJob(
                    id=job_id,
                    status=TryOnStatus.FAILED,
                    provider=self.provider.name,
                    error=str(exc),
                ),
                ProviderSubmission(provider=self.provider.name),
            )

        return (
            TryOnJob(
                id=job_id,
                status=TryOnStatus.QUEUED,
                provider=submission.provider,
            ),
            submission,
        )
