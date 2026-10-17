"""Product data access service."""

from typing import Any

from app.db.supabase import get_supabase_client


class ProductNotFoundError(Exception):
    """Raised when a requested product does not exist or is inactive."""


def list_active_products() -> list[dict[str, Any]]:
    """Return published, active products from public.products, newest first."""

    response = (
        get_supabase_client()
        .table("products")
        .select("*")
        .eq("active", True)
        .eq("status", "published")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def get_active_product(product_id: str) -> dict[str, Any]:
    """Return one active product or raise ProductNotFoundError."""

    response = (
        get_supabase_client()
        .table("products")
        .select("*")
        .eq("id", product_id)
        .eq("active", True)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise ProductNotFoundError(product_id)
    return response.data[0]
