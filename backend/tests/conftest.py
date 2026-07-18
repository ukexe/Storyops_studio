"""Pytest configuration for the StoryOps Studio backend test suite."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import get_current_user, get_optional_current_user
from app.database import get_db
from app.models.base import Base

pytest_plugins = ["pytest_asyncio"]

TEST_USER_ID = str(uuid.UUID("00000000-0000-0000-0000-000000000001"))
OTHER_USER_ID = str(uuid.UUID("00000000-0000-0000-0000-000000000002"))

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


class _TestClient:
    """Thin async-client wrapper that sets a specific user_id before each request."""

    def __init__(self, ac: AsyncClient, app, db_session: AsyncSession, user_id: str):
        self._ac = ac
        self._app = app
        self._session = db_session
        self.user_id = user_id

    def _apply_overrides(self):
        uid = self.user_id

        async def _auth():
            return {"user_id": uid}

        async def _db():
            yield self._session

        self._app.dependency_overrides[get_current_user] = _auth
        self._app.dependency_overrides[get_optional_current_user] = _auth
        self._app.dependency_overrides[get_db] = _db

    async def get(self, url, **kw):
        self._apply_overrides()
        return await self._ac.get(url, **kw)

    async def post(self, url, **kw):
        self._apply_overrides()
        return await self._ac.post(url, **kw)

    async def patch(self, url, **kw):
        self._apply_overrides()
        return await self._ac.patch(url, **kw)

    async def delete(self, url, **kw):
        self._apply_overrides()
        return await self._ac.delete(url, **kw)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[_TestClient, None]:
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield _TestClient(ac, app, db_session, TEST_USER_ID)
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def other_client(db_session: AsyncSession) -> AsyncGenerator[_TestClient, None]:
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield _TestClient(ac, app, db_session, OTHER_USER_ID)
    app.dependency_overrides.clear()
