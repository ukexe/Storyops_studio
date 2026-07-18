from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.dispatcher import dispatch
from app.agents.watsonx_client import WatsonxError
from app.auth import get_current_user
from app.database import get_db
from app.models.analysis import Analysis
from app.models.item import Item
from app.models.project import Project
from app.schemas.analysis import AnalysisResponse

router = APIRouter(tags=["analyses"])
logger = logging.getLogger(__name__)

DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


async def _get_owned_item(
    item_id: uuid.UUID,
    user_id: str,
    db: AsyncSession,
) -> Item:
    result = await db.execute(
        select(Item)
        .join(Project, Project.id == Item.project_id)
        .where(
            Item.id == item_id,
            Project.owner_id == uuid.UUID(user_id),
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.get("/items/{item_id}/analyses", response_model=list[AnalysisResponse])
async def list_analyses(
    item_id: uuid.UUID, db: DB, user: CurrentUser
) -> list[AnalysisResponse]:
    """List all analyses for an item, most recent first."""
    await _get_owned_item(item_id, user["user_id"], db)

    result = await db.execute(
        select(Analysis)
        .where(Analysis.item_id == item_id)
        .order_by(Analysis.created_at.desc())
    )
    analyses = result.scalars().all()
    return [AnalysisResponse.model_validate(a) for a in analyses]


@router.post("/items/{item_id}/analyze", response_model=AnalysisResponse)
async def analyze_item(
    item_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
) -> AnalysisResponse:
    """Run the item-type agent and persist its analysis and generated tasks."""
    item = await _get_owned_item(item_id, user["user_id"], db)
    try:
        analysis = await dispatch(item, db)
    except WatsonxError as exc:
        logger.warning("watsonx.ai analysis failed for item %s: %s", item_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="watsonx.ai analysis is currently unavailable",
        ) from exc
    except ValueError as exc:
        logger.warning("Agent returned invalid output for item %s: %s", item_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI agent returned an invalid analysis",
        ) from exc

    return AnalysisResponse.model_validate(analysis)
