"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the WEARO Python services."""

    app_name: str = "WEARO AI Backend"
    environment: str = "development"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    storage_bucket: str = ""
    try_on_provider: str = "stub"
    fashn_api_key: str = ""
    replicate_api_token: str = ""
    replicate_tryon_model: str = ""
    replicate_tryon_person_image_field: str = "human_img"
    replicate_tryon_garment_image_field: str = "garm_img"
    replicate_tryon_category_field: str = "category"
    replicate_tryon_description_field: str = "garment_des"
    local_tryon_api_url: str = ""
    local_tryon_api_key: str = ""
    gemini_api_key: str = ""
    gemini_product_vision_model: str = "gemini-3.8-flash"
    cron_secret: str = ""
    try_on_worker_batch_size: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()
