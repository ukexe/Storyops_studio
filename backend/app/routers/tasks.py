from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.item import Item
from app.models.project import Project
from app.models.task import Task
from app.schemas.task import TaskResponse, TaskStatus, TaskStatusUpdate

router = APIRouter(tags=["tasks"])

DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


def _task_response(task: Task, linked_item_title: str | None) -> TaskResponse:
    response = TaskResponse.model_validate(task)
    response.linked_item_title = linked_item_title
    return response


async def _get_owned_project(
    project_id: uuid.UUID, user_id: str, db: AsyncSession
) -> Project:
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


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    project_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    task_status: TaskStatus | None = Query(default=None, alias="status"),
) -> list[TaskResponse]:
    """List tasks for a project, with optional ?status= filter."""
    await _get_owned_project(project_id, user["user_id"], db)

    query = (
        select(Task, Item.title.label("linked_item_title"))
        .outerjoin(Item, Item.id == Task.linked_item_id)
        .where(Task.project_id == project_id)
    )
    if task_status:
        query = query.where(Task.status == task_status)
    query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    return [
        _task_response(task, linked_item_title)
        for task, linked_item_title in result.all()
    ]


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID, body: TaskStatusUpdate, db: DB, user: CurrentUser
) -> TaskResponse:
    """Update a task's status and/or priority."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Verify ownership via project
    await _get_owned_project(task.project_id, user["user_id"], db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    linked_item_title = None
    if task.linked_item_id is not None:
        linked_item_title = await db.scalar(
            select(Item.title).where(Item.id == task.linked_item_id)
        )
    return _task_response(task, linked_item_title)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_task(task_id: uuid.UUID, db: DB, user: CurrentUser) -> None:
    """Hard-delete a task."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await _get_owned_project(task.project_id, user["user_id"], db)
    await db.delete(task)
    await db.commit()
