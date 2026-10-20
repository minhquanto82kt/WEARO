"""Replicate API adapter for configurable virtual try-on models."""

from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.url_security import validate_trusted_image_url
from app.models.try_on import TryOnCategory, TryOnRequest


class ReplicateProviderError(Exception):
    """Raised when Replicate rejects or cannot complete a prediction."""


@dataclass(frozen=True)
class ReplicatePrediction:
    """Replicate prediction identifier."""

    id: str


class ReplicateTryOnProvider:
    """Submit and poll Replicate predictions behind the Try-On provider contract."""

    name = "replicate"
    api_base = "https://api.replicate.com/v1"

    def __init__(self, *, api_token: str | None = None, model: str | None = None, timeout: float = 30.0) -> None:
        settings = get_settings()
        self.api_token = api_token or settings.replicate_api_token
        self.model = model or settings.replicate_tryon_model
        self.person_field = settings.replicate_tryon_person_image_field
        self.garment_field = settings.replicate_tryon_garment_image_field
        self.category_field = settings.replicate_tryon_category_field
        self.description_field = settings.replicate_tryon_description_field
        self.timeout = timeout

    def submit(self, request: TryOnRequest) -> ReplicatePrediction:
        """Submit a model prediction to Replicate."""
        if not self.api_token:
            raise ReplicateProviderError("REPLICATE_API_TOKEN is not configured")
        if not self.model or "/" not in self.model.strip("/"):
            raise ReplicateProviderError("REPLICATE_TRYON_MODEL must be an owner/model slug")

        try:
            validate_trusted_image_url(request.person_image_url)
            validate_trusted_image_url(request.garment_image_url)
        except ValueError as exc:
            raise ReplicateProviderError(str(exc)) from exc

        inputs: dict[str, Any] = {
            self.person_field: request.person_image_url,
            self.garment_field: request.garment_image_url,
        }
        if self.category_field:
            inputs[self.category_field] = self._category(request.category)
        if self.description_field:
            inputs[self.description_field] = str(request.metadata.get("note") or "clothing item")

        try:
            response = httpx.post(
                f"{self.api_base}/models/{self.model.strip('/')}/predictions",
                json={"input": inputs},
                headers=self._headers(),
                timeout=self.timeout,
            )
        except httpx.HTTPError as exc:
            raise ReplicateProviderError("Unable to reach Replicate API") from exc

        if response.status_code >= 400:
            raise ReplicateProviderError(self._error_message(response))
        try:
            body = response.json()
        except ValueError as exc:
            raise ReplicateProviderError("Replicate returned invalid JSON") from exc

        prediction_id = body.get("id") if isinstance(body, dict) else None
        if not prediction_id:
            raise ReplicateProviderError("Replicate did not return a prediction id")
        return ReplicatePrediction(id=str(prediction_id))

    def get_status(self, prediction_id: str) -> dict[str, Any]:
        """Fetch a prediction status and normalize Replicate output for the shared lifecycle."""
        if not self.api_token:
            raise ReplicateProviderError("REPLICATE_API_TOKEN is not configured")
        if not prediction_id.strip():
            raise ValueError("prediction_id is required")
        try:
            response = httpx.get(
                f"{self.api_base}/predictions/{prediction_id}",
                headers=self._headers(),
                timeout=self.timeout,
            )
        except httpx.HTTPError as exc:
            raise ReplicateProviderError("Unable to reach Replicate API") from exc
        if response.status_code >= 400:
            raise ReplicateProviderError(self._error_message(response))
        try:
            body = response.json()
        except ValueError as exc:
            raise ReplicateProviderError("Replicate returned invalid status JSON") from exc
        if not isinstance(body, dict):
            raise ReplicateProviderError("Replicate returned an invalid status payload")

        status_name = str(body.get("status") or "").lower()
        return {
            **body,
            "status": {
                "succeeded": "completed",
                "starting": "starting",
                "processing": "processing",
                "failed": "failed",
                "canceled": "canceled",
                "cancelled": "cancelled",
            }.get(status_name, status_name),
        }

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "Prefer": "wait=1",
        }

    @staticmethod
    def _category(category: TryOnCategory) -> str:
        return {
            TryOnCategory.TOP: "tops",
            TryOnCategory.BOTTOM: "bottoms",
            TryOnCategory.DRESS: "one-pieces",
            TryOnCategory.OUTERWEAR: "tops",
            TryOnCategory.FULL_BODY: "auto",
        }[category]

    @staticmethod
    def _error_message(response: httpx.Response) -> str:
        try:
            body = response.json()
            if isinstance(body, dict):
                detail = body.get("detail") or body.get("error")
                if detail:
                    return str(detail)[:500]
        except ValueError:
            pass
        return f"Replicate API request failed with status {response.status_code}"
