"""Security-focused tests for asset storage and analysis URLs."""
from __future__ import annotations

import pytest

from app.agents.asset_agent import _fetch_image_bytes
from app.config import settings
from app.storage import detect_image_content_type, is_asset_path, is_public_asset_url


def test_detect_image_content_type_uses_magic_bytes():
    assert detect_image_content_type(b"\xff\xd8\xffimage") == (
        "image/jpeg",
        ".jpg",
    )
    with pytest.raises(ValueError, match="Unsupported image"):
        detect_image_content_type(b"not-an-image")


def test_public_asset_url_is_limited_to_configured_bucket(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://project.supabase.co")

    assert is_public_asset_url(
        "https://project.supabase.co/storage/v1/object/public/assets/project/a.jpg"
    )
    assert not is_public_asset_url(
        "https://other.supabase.co/storage/v1/object/public/assets/project/a.jpg"
    )
    assert not is_public_asset_url("http://127.0.0.1/internal")


def test_private_asset_path_is_project_scoped():
    path = "00000000-0000-0000-0000-000000000001/thumbnail.jpg"
    assert is_asset_path(path)
    assert not is_asset_path("../thumbnail.jpg")
    assert not is_asset_path("not-a-uuid/thumbnail.jpg")


@pytest.mark.asyncio
async def test_asset_fetch_rejects_untrusted_url_before_network(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://project.supabase.co")

    with pytest.raises(ValueError, match="outside"):
        await _fetch_image_bytes("http://169.254.169.254/latest/meta-data")


@pytest.mark.asyncio
async def test_asset_fetch_downloads_private_object(monkeypatch):
    monkeypatch.setattr(
        "app.agents.asset_agent.download_asset",
        lambda _path: b"\xff\xd8\xffprivate-image",
    )

    result = await _fetch_image_bytes(
        "00000000-0000-0000-0000-000000000001/thumbnail.jpg"
    )

    assert result.startswith(b"\xff\xd8\xff")
