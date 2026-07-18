from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.agents.watsonx_client import (
    WatsonxError,
    get_client,
    get_connection_status,
)
from app.routers import analyses as analyses_router
from app.routers import demo as demo_router
from app.routers import items as items_router
from app.routers import projects as projects_router
from app.routers import tasks as tasks_router

logger = logging.getLogger(__name__)
DatabaseStatus = Literal["unknown", "connected", "error"]
_database_status: DatabaseStatus = "unknown"


async def _check_database() -> DatabaseStatus:
    try:
        async with engine.connect() as conn:
            await asyncio.wait_for(conn.execute(text("SELECT 1")), timeout=5)
        return "connected"
    except Exception as exc:  # noqa: BLE001
        logger.warning("Database readiness check failed: %s", exc)
        return "error"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _database_status
    # Startup: verify database connectivity
    _database_status = await _check_database()
    if _database_status == "connected":
        logger.info("Database connection OK")

    try:
        watsonx_client = get_client()
        await watsonx_client.check_connection()
        logger.info("watsonx.ai connection OK")
    except WatsonxError as exc:
        # AI connectivity is reported by /health but does not prevent offline development.
        logger.warning("watsonx.ai connection failed on startup: %s", exc)

    logger.info("StoryOps Studio API starting up")
    yield
    await engine.dispose()
    logger.info("StoryOps Studio API shutting down")


app = FastAPI(
    title="StoryOps Studio API",
    description="Agentic AI creative operations platform — IBM AI Builders Challenge 2026",
    version="1.1.0",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(projects_router.router, prefix=API_PREFIX)
app.include_router(items_router.router, prefix=API_PREFIX)
app.include_router(tasks_router.router, prefix=API_PREFIX)
app.include_router(analyses_router.router, prefix=API_PREFIX)
app.include_router(demo_router.router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {"name": "StoryOps Studio API", "version": app.version}


@app.get("/health", tags=["system"])
async def health() -> JSONResponse:
    """Report readiness of required API dependencies."""
    global _database_status
    _database_status = await _check_database()
    payload = {
        "status": "ok" if _database_status != "error" else "error",
        "database": _database_status,
        "watsonx": get_connection_status(),
    }
    return JSONResponse(
        status_code=(
            status.HTTP_200_OK
            if _database_status != "error"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        ),
        content=payload,
    )


@app.get("/live", tags=["system"])
async def live() -> dict[str, str]:
    """Lightweight process liveness probe."""
    return {"status": "ok"}
