"""Supabase Storage helper — wraps the supabase-py secret-key client."""
from __future__ import annotations

import uuid
from urllib.parse import urlparse

from supabase import Client, create_client

from app.config import settings

BUCKET_NAME = "assets"

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return (or create) the module-level Supabase secret-key client."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    return _supabase


def detect_image_content_type(data: bytes) -> tuple[str, str]:
    """Return a trusted MIME type and extension from image magic bytes."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif", ".gif"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp", ".webp"
    raise ValueError("Unsupported image format")


def storage_object_path(project_id: str, filename: str) -> str:
    return f"{project_id}/{filename}"


def upload_asset(project_id: str, filename: str, data: bytes) -> str:
    """Upload a file to Supabase Storage and return its object path.

    Path: assets/{project_id}/{filename}
    """
    client = get_supabase()
    path = storage_object_path(project_id, filename)
    content_type, _ = detect_image_content_type(data)

    # upsert=True so re-uploads overwrite cleanly
    client.storage.from_(BUCKET_NAME).upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    return path


def delete_asset(project_id: str, filename: str) -> None:
    """Delete an uploaded project asset."""
    get_supabase().storage.from_(BUCKET_NAME).remove(
        [storage_object_path(project_id, filename)]
    )


def is_public_asset_url(url: str) -> bool:
    """Allow only this project's configured public Supabase assets endpoint."""
    try:
        candidate = urlparse(url)
        supabase = urlparse(settings.SUPABASE_URL)
    except ValueError:
        return False

    return (
        candidate.scheme in {"http", "https"}
        and candidate.scheme == supabase.scheme
        and candidate.netloc == supabase.netloc
        and candidate.path.startswith(f"/storage/v1/object/public/{BUCKET_NAME}/")
        and not candidate.username
        and not candidate.password
    )


def is_asset_path(value: str) -> bool:
    project_id, separator, filename = value.partition("/")
    if (
        not separator
        or not project_id
        or not filename
        or "/" in filename
        or ".." in value
    ):
        return False
    try:
        uuid.UUID(project_id)
    except ValueError:
        return False
    return True


def create_signed_asset_url(path: str, expires_in: int = 3600) -> str:
    if not is_asset_path(path):
        raise ValueError("Invalid asset object path")
    response = get_supabase().storage.from_(BUCKET_NAME).create_signed_url(
        path,
        expires_in,
    )
    signed_url = response.get("signedURL") or response.get("signedUrl")
    if not signed_url:
        raise ValueError("Supabase did not return a signed asset URL")
    if signed_url.startswith("/"):
        return f"{settings.SUPABASE_URL.rstrip('/')}{signed_url}"
    return signed_url


def download_asset(path: str) -> bytes:
    if not is_asset_path(path):
        raise ValueError("Invalid asset object path")
    return get_supabase().storage.from_(BUCKET_NAME).download(path)


def asset_location_from_url(url: str) -> tuple[str, str] | None:
    if is_asset_path(url):
        project_id, filename = url.split("/", 1)
        return project_id, filename
    if not is_public_asset_url(url):
        return None
    path = urlparse(url).path
    prefix = f"/storage/v1/object/public/{BUCKET_NAME}/"
    relative = path.removeprefix(prefix)
    project_id, separator, filename = relative.partition("/")
    if not separator or not project_id or not filename or "/" in filename:
        return None
    return project_id, filename


def delete_asset_url(url: str) -> None:
    """Delete a public asset URL when it belongs to the configured bucket."""
    location = asset_location_from_url(url)
    if location is None:
        return
    delete_asset(*location)
