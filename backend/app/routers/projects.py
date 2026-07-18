from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.constants import PIPELINE_STAGES
from app.database import get_db
from app.models.item import Item
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.storage import delete_asset_url

router = APIRouter(prefix="/projects", tags=["projects"])
logger = logging.getLogger(__name__)

# Convenience type aliases
DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


def _zero_item_counts() -> dict[str, int]:
    return {stage: 0 for stage in PIPELINE_STAGES}


def _project_response(
    project: Project,
    item_counts: dict[str, int] | None = None,
) -> ProjectResponse:
    response = ProjectResponse.model_validate(project)
    response.item_counts = item_counts or _zero_item_counts()
    return response


async def _get_item_counts(
    project_id: uuid.UUID,
    db: AsyncSession,
) -> dict[str, int]:
    counts_result = await db.execute(
        select(Item.stage, func.count(Item.id).label("cnt"))
        .where(Item.project_id == project_id)
        .group_by(Item.stage)
    )
    item_counts = _zero_item_counts()
    item_counts.update({row.stage: row.cnt for row in counts_result})
    return item_counts


async def _get_owned_project(
    project_id: uuid.UUID, user_id: str, db: AsyncSession
) -> Project:
    """Fetch a project that belongs to the current user.

    Returns 404 whether the project doesn't exist OR belongs to another user
    (avoids leaking existence of other users' projects).
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == uuid.UUID(user_id),
        )
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(db: DB, user: CurrentUser) -> list[ProjectResponse]:
    """List all projects owned by the authenticated user."""
    result = await db.execute(
        select(Project)
        .where(Project.owner_id == uuid.UUID(user["user_id"]))
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    if not projects:
        return []

    counts_result = await db.execute(
        select(
            Item.project_id,
            Item.stage,
            func.count(Item.id).label("cnt"),
        )
        .where(Item.project_id.in_([project.id for project in projects]))
        .group_by(Item.project_id, Item.stage)
    )
    counts_by_project: dict[uuid.UUID, dict[str, int]] = {
        project.id: _zero_item_counts() for project in projects
    }
    for row in counts_result:
        counts_by_project[row.project_id][row.stage] = row.cnt

    responses: list[ProjectResponse] = []
    for project in projects:
        responses.append(_project_response(project, counts_by_project[project.id]))
    return responses


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, db: DB, user: CurrentUser) -> ProjectResponse:
    """Create a new project owned by the authenticated user."""
    project = Project(
        owner_id=uuid.UUID(user["user_id"]),
        name=body.name,
        description=body.description,
        repo_url=body.repo_url,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: DB, user: CurrentUser) -> ProjectResponse:
    """Return project detail with item counts per stage."""
    project = await _get_owned_project(project_id, user["user_id"], db)

    return _project_response(project, await _get_item_counts(project_id, db))


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID, body: ProjectUpdate, db: DB, user: CurrentUser
) -> ProjectResponse:
    """Partial update of a project's name, description, or repo_url."""
    project = await _get_owned_project(project_id, user["user_id"], db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return _project_response(project, await _get_item_counts(project_id, db))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_project(
    project_id: uuid.UUID, db: DB, user: CurrentUser
) -> None:
    """Hard-delete a project and all its cascade-linked records."""
    project = await _get_owned_project(project_id, user["user_id"], db)
    asset_urls = (
        await db.execute(
            select(Item.file_url).where(
                Item.project_id == project_id,
                Item.file_url.is_not(None),
            )
        )
    ).scalars().all()
    await db.delete(project)
    await db.commit()
    for asset_url in asset_urls:
        try:
            await asyncio.to_thread(delete_asset_url, asset_url)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to remove an asset for project %s", project_id)
