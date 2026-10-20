"""Supabase client factory."""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Create and cache the server-side Supabase client.

    The service-role key is read only from the Python backend environment and
    must never be exposed to the frontend.
    """

    settings = get_settings()
    service_role_key = settings.supabase_service_role_key or settings.supabase_secret_key
    if not settings.supabase_url or not service_role_key:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and either "
            "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in the server environment."
        )

    return create_client(settings.supabase_url, service_role_key)
