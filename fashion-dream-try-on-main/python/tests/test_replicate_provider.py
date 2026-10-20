"""Unit tests for the Replicate Try-On adapter without real API calls."""

import httpx
import pytest

from app.core.config import get_settings
from app.models.try_on import TryOnCategory, TryOnRequest
from app.services.replicate_provider import ReplicateProviderError, ReplicateTryOnProvider


REQUEST = TryOnRequest(
    person_image_url="https://project.supabase.co/storage/v1/object/sign/try-on/person.webp",
    garment_image_url="https://project.supabase.co/storage/v1/object/sign/try-on/garment.webp",
    category=TryOnCategory.TOP,
)


@pytest.fixture(autouse=True)
def configured_provider_defaults(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.delenv("REPLICATE_TRYON_PERSON_IMAGE_FIELD", raising=False)
    monkeypatch.delenv("REPLICATE_TRYON_GARMENT_IMAGE_FIELD", raising=False)
    monkeypatch.delenv("REPLICATE_TRYON_CATEGORY_FIELD", raising=False)
    monkeypatch.delenv("REPLICATE_TRYON_DESCRIPTION_FIELD", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_submit_builds_payload_for_configured_p_image_try_on_model(monkeypatch) -> None:
    captured = {}

    def fake_post(url, *, json, headers, timeout):
        captured.update(url=url, json=json, headers=headers, timeout=timeout)
        return httpx.Response(
            201,
            json={"id": "prediction-123", "status": "starting"},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr("app.services.replicate_provider.httpx.post", fake_post)

    prediction = ReplicateTryOnProvider(
        api_token="test-token",
        model="prunaai/p-image-try-on",
    ).submit(REQUEST)

    assert prediction.id == "prediction-123"
    assert captured["url"].endswith("/models/prunaai/p-image-try-on/predictions")
    assert captured["json"]["input"] == {
        "person_image": REQUEST.person_image_url,
        "garment_images": [REQUEST.garment_image_url],
    }
    assert captured["headers"]["Authorization"] == "Bearer test-token"


def test_submit_adds_optional_prompt_only_when_note_is_provided(monkeypatch) -> None:
    captured = {}

    def fake_post(url, *, json, headers, timeout):
        captured.update(json=json)
        return httpx.Response(
            201,
            json={"id": "prediction-123"},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr("app.services.replicate_provider.httpx.post", fake_post)
    request = REQUEST.model_copy(update={"metadata": {"note": "keep the blue hoodie"}})

    ReplicateTryOnProvider(api_token="test-token", model="prunaai/p-image-try-on").submit(request)

    assert captured["json"]["input"]["prompt"] == "keep the blue hoodie"


def test_get_status_normalizes_replicate_succeeded_status(monkeypatch) -> None:
    def fake_get(url, *, headers, timeout):
        return httpx.Response(
            200,
            json={"id": "prediction-123", "status": "succeeded", "output": "https://replicate.delivery/result.webp"},
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr("app.services.replicate_provider.httpx.get", fake_get)

    payload = ReplicateTryOnProvider(
        api_token="test-token",
        model="prunaai/p-image-try-on",
    ).get_status("prediction-123")

    assert payload["status"] == "completed"
    assert payload["output"].endswith("result.webp")


def test_submit_requires_api_token() -> None:
    with pytest.raises(ReplicateProviderError, match="REPLICATE_API_TOKEN"):
        ReplicateTryOnProvider(api_token="", model="prunaai/p-image-try-on").submit(REQUEST)


def test_submit_rejects_untrusted_image_host() -> None:
    request = REQUEST.model_copy(update={"person_image_url": "https://example.com/person.webp"})

    with pytest.raises(ReplicateProviderError, match="Supabase"):
        ReplicateTryOnProvider(api_token="test-token", model="prunaai/p-image-try-on").submit(request)
