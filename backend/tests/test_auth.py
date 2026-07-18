"""Focused tests for Supabase JWT signing-key handling."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app import auth


def _credentials() -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")


@pytest.mark.asyncio
async def test_get_current_user_accepts_matching_es256_key(monkeypatch):
    async def fake_get_jwks(*, force_refresh: bool = False):
        assert force_refresh is False
        return {"keys": [{"kid": "signing-key", "alg": "ES256", "kty": "EC"}]}

    decode = Mock(
        return_value={"sub": "00000000-0000-0000-0000-000000000001"}
    )
    monkeypatch.setattr(auth, "_get_jwks", fake_get_jwks)
    monkeypatch.setattr(
        auth.jwt,
        "get_unverified_header",
        lambda _token: {"kid": "signing-key", "alg": "ES256"},
    )
    monkeypatch.setattr(auth.jwt, "decode", decode)
    monkeypatch.setattr(
        auth.jwt.PyJWK,
        "from_dict",
        lambda _key: SimpleNamespace(key="public-key"),
    )

    user = await auth.get_current_user(_credentials())

    assert user == {"user_id": "00000000-0000-0000-0000-000000000001"}
    assert decode.call_args.kwargs["algorithms"] == ["ES256"]
    assert decode.call_args.kwargs["audience"] == "authenticated"
    assert decode.call_args.kwargs["issuer"].endswith("/auth/v1")


@pytest.mark.asyncio
async def test_get_current_user_refreshes_then_rejects_unknown_kid(monkeypatch):
    refreshes: list[bool] = []

    async def fake_get_jwks(*, force_refresh: bool = False):
        refreshes.append(force_refresh)
        return {"keys": [{"kid": "different-key", "alg": "RS256"}]}

    monkeypatch.setattr(auth, "_get_jwks", fake_get_jwks)
    monkeypatch.setattr(
        auth.jwt,
        "get_unverified_header",
        lambda _token: {"kid": "unknown-key", "alg": "RS256"},
    )

    with pytest.raises(HTTPException) as error:
        await auth.get_current_user(_credentials())

    assert error.value.status_code == 401
    assert refreshes == [False, True]


@pytest.mark.asyncio
async def test_get_current_user_rejects_non_uuid_subject(monkeypatch):
    async def fake_get_jwks(*, force_refresh: bool = False):
        return {"keys": [{"kid": "signing-key", "alg": "RS256"}]}

    monkeypatch.setattr(auth, "_get_jwks", fake_get_jwks)
    monkeypatch.setattr(
        auth.jwt,
        "get_unverified_header",
        lambda _token: {"kid": "signing-key", "alg": "RS256"},
    )
    monkeypatch.setattr(auth.jwt, "decode", lambda *_args, **_kwargs: {"sub": "nope"})
    monkeypatch.setattr(
        auth.jwt.PyJWK,
        "from_dict",
        lambda _key: SimpleNamespace(key="public-key"),
    )

    with pytest.raises(HTTPException) as error:
        await auth.get_current_user(_credentials())

    assert error.value.status_code == 401
