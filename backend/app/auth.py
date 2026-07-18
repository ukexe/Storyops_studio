from __future__ import annotations

import logging
import uuid
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWKS cache — fetched once on first authenticated request
# ---------------------------------------------------------------------------
_jwks_cache: dict[str, Any] | None = None

bearer_scheme = HTTPBearer(auto_error=False)
SUPPORTED_JWT_ALGORITHMS = {"RS256", "ES256"}


async def _get_jwks(*, force_refresh: bool = False) -> dict[str, Any]:
    """Fetch and cache the Supabase JWKS endpoint."""
    global _jwks_cache
    if _jwks_cache is not None and not force_refresh:
        return _jwks_cache

    jwks_url = (
        f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            logger.info("JWKS fetched and cached from %s", jwks_url)
            return _jwks_cache
    except Exception as exc:
        logger.warning("Failed to fetch JWKS: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable — could not fetch JWKS",
        ) from exc


def _find_public_key(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    keys: list[dict] = jwks.get("keys", [])
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No keys found in JWKS",
        )
    return next((key for key in keys if key.get("kid") == kid), None)


async def _get_public_key(kid: str) -> dict[str, Any]:
    public_key = _find_public_key(await _get_jwks(), kid)
    if public_key is None:
        # Refresh once so signing-key rotation does not require an API restart.
        public_key = _find_public_key(await _get_jwks(force_refresh=True), kid)
    if public_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signing key is not recognized",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return public_key


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, str]:
    """FastAPI dependency — validates the Supabase JWT and returns {user_id}.

    Raises HTTP 401 on any validation failure.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Peek at the header to find the key ID
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    algorithm = unverified_header.get("alg")
    kid = unverified_header.get("kid")
    if algorithm not in SUPPORTED_JWT_ALGORITHMS or not isinstance(kid, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported token signing configuration",
            headers={"WWW-Authenticate": "Bearer"},
        )

    public_key = await _get_public_key(kid)
    if public_key.get("alg") and public_key["alg"] != algorithm:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signing algorithm does not match its key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        signing_key = jwt.PyJWK.from_dict(public_key).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[algorithm],
            audience="authenticated",
            issuer=f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
            options={"verify_exp": True, "verify_iss": True},
        )
    except jwt.PyJWTError as exc:
        logger.info("Supabase token validation failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id: str | None = payload.get("sub")
    try:
        parsed_user_id = uuid.UUID(user_id) if user_id else None
    except ValueError:
        parsed_user_id = None
    if parsed_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject is not a valid user ID",
        )

    return {"user_id": str(parsed_user_id)}


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, str] | None:
    """Validate a bearer token when supplied, otherwise allow anonymous access."""
    if credentials is None:
        return None
    return await get_current_user(credentials)
