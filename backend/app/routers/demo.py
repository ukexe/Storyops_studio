"""One-call demo project seeding for the competition walkthrough."""
from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.dispatcher import dispatch
from app.agents.watsonx_client import WatsonxError
from app.auth import get_optional_current_user
from app.config import settings
from app.database import get_db
from app.models.item import Item
from app.models.project import Project
from app.storage import delete_asset, upload_asset

router = APIRouter(prefix="/demo", tags=["demo"])
logger = logging.getLogger(__name__)

DB = Annotated[AsyncSession, Depends(get_db)]
OptionalCurrentUser = Annotated[dict[str, str] | None, Depends(get_optional_current_user)]
DEMO_OWNER_ID = uuid.UUID("00000000-0000-0000-0000-000000000042")
DEMO_DIR = Path(__file__).resolve().parents[2] / "demo"
DEMO_PROJECT_NAME = "YouTube Series — AI Explained"
DEMO_THUMBNAIL_NAME = "sample-thumbnail.jpg"


class DemoSeedResponse(BaseModel):
    project_id: uuid.UUID


@router.post(
    "/seed",
    response_model=DemoSeedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def seed_demo(db: DB, user: OptionalCurrentUser) -> DemoSeedResponse:
    """Create and analyze the complete StoryOps judging demo in one transaction."""
    if user is None and not settings.ALLOW_ANONYMOUS_DEMO_SEED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to seed the demo",
        )

    brief_path = DEMO_DIR / "sample-brief.txt"
    script_path = DEMO_DIR / "sample-script.txt"
    thumbnail_path = DEMO_DIR / DEMO_THUMBNAIL_NAME
    owner_id = uuid.UUID(user["user_id"]) if user else DEMO_OWNER_ID
    existing_project_id = await db.scalar(
        select(Project.id)
        .where(
            Project.owner_id == owner_id,
            Project.name == DEMO_PROJECT_NAME,
        )
        .order_by(Project.created_at.desc())
        .limit(1)
    )
    if existing_project_id is not None:
        return DemoSeedResponse(project_id=existing_project_id)

    uploaded_project_id: str | None = None
    try:
        brief_content, script_content, thumbnail_bytes = await asyncio.gather(
            asyncio.to_thread(brief_path.read_text, encoding="utf-8"),
            asyncio.to_thread(script_path.read_text, encoding="utf-8"),
            asyncio.to_thread(thumbnail_path.read_bytes),
        )

        project = Project(
            owner_id=owner_id,
            name=DEMO_PROJECT_NAME,
            description=(
                "Demo project for StoryOps Studio — IBM AI Builders Challenge 2026"
            ),
        )
        db.add(project)
        await db.flush()

        thumbnail_url = await asyncio.to_thread(
            upload_asset,
            str(project.id),
            thumbnail_path.name,
            thumbnail_bytes,
        )
        uploaded_project_id = str(project.id)

        brief = Item(
            project_id=project.id,
            stage="Script",
            type="brief",
            title="Video Brief",
            content=brief_content,
            item_metadata={},
        )
        script = Item(
            project_id=project.id,
            stage="Script",
            type="script",
            title="Script Draft v1",
            content=script_content,
            item_metadata={"content_type": "youtube"},
        )
        asset = Item(
            project_id=project.id,
            stage="Assets",
            type="asset",
            title="Thumbnail v1",
            file_url=thumbnail_url,
            item_metadata={},
        )
        feedback = Item(
            project_id=project.id,
            stage="Feedback",
            type="feedback",
            title="Director Notes",
            content=(
                "Great energy in the second half. The opening hook needs work — "
                "we lose viewers in the first 15 seconds. Also missing a clear "
                "subscribe CTA."
            ),
            item_metadata={},
        )
        db.add_all([brief, script, asset, feedback])
        await db.flush()

        # Keep the seed atomic: dispatch stages rows without committing, then
        # commit the project, items, analyses, and tasks together.
        for item in (brief, script, asset):
            await dispatch(item, db, commit=False)

        await db.commit()
        return DemoSeedResponse(project_id=project.id)
    except (WatsonxError, ValueError) as exc:
        await db.rollback()
        await _cleanup_thumbnail(uploaded_project_id)
        logger.warning("Demo AI analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Demo analysis could not be completed",
        ) from exc
    except OSError as exc:
        await db.rollback()
        await _cleanup_thumbnail(uploaded_project_id)
        logger.exception("Demo fixture could not be loaded")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo fixture is unavailable",
        ) from exc
    except Exception as exc:
        await db.rollback()
        await _cleanup_thumbnail(uploaded_project_id)
        logger.exception("Demo seed failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo project could not be created",
        ) from exc


async def _cleanup_thumbnail(project_id: str | None) -> None:
    if project_id is None:
        return
    try:
        await asyncio.to_thread(delete_asset, project_id, DEMO_THUMBNAIL_NAME)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to clean up demo thumbnail for project %s", project_id)
