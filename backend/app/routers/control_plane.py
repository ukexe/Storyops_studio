from __future__ import annotations

import asyncio
import base64
import binascii
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.artifact import Artifact
from app.models.conversation import Conversation, ConversationMessage
from app.models.project import Project
from app.models.workflow import WorkflowRun, WorkflowStep
from app.models.workspace_event import WorkspaceEvent
from app.rate_limit import enforce_rate_limit
from app.schemas.control_plane import (
    ArtifactResponse,
    ConsoleTurnCreate,
    ConsoleTurnResponse,
    ConversationMessageResponse,
    ConversationResponse,
    WorkspaceEventPage,
    WorkspaceEventResponse,
    WorkflowRunResponse,
    WorkflowStepResponse,
)
from app.services.control_plane import execute_console_turn
from app.storage import create_signed_asset_url, is_asset_path_for_project

router = APIRouter(tags=["control-plane"])

DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict[str, str], Depends(get_current_user)]


async def _owned_project(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Project:
    project = await db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == user_id,
        )
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


async def _owned_conversation(
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Conversation:
    conversation = await db.scalar(
        select(Conversation)
        .join(Project, Project.id == Conversation.project_id)
        .where(
            Conversation.id == conversation_id,
            Conversation.owner_id == user_id,
            Project.owner_id == user_id,
        )
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


async def _owned_run(
    run_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> WorkflowRun:
    run = await db.scalar(
        select(WorkflowRun)
        .join(Project, Project.id == WorkflowRun.project_id)
        .where(
            WorkflowRun.id == run_id,
            Project.owner_id == user_id,
        )
    )
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow run not found",
        )
    return run


async def _artifact_response(artifact: Artifact) -> ArtifactResponse:
    response = ArtifactResponse.model_validate(artifact)
    if artifact.storage_path:
        if not is_asset_path_for_project(
            artifact.storage_path,
            artifact.project_id,
        ):
            return response
        try:
            response.content_url = await asyncio.to_thread(
                create_signed_asset_url,
                artifact.storage_path,
            )
        except Exception:  # noqa: BLE001
            response.content_url = None
    return response


@router.post(
    "/projects/{project_id}/console/turns",
    response_model=ConsoleTurnResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_console_turn(
    project_id: uuid.UUID,
    body: ConsoleTurnCreate,
    db: DB,
    user: CurrentUser,
) -> ConsoleTurnResponse:
    user_id = uuid.UUID(user["user_id"])
    await enforce_rate_limit(
        f"console:{user_id}",
        limit=20,
        window_seconds=60,
    )
    project = await _owned_project(project_id, user_id, db)
    try:
        result = await execute_console_turn(
            db,
            project=project,
            user_id=user_id,
            request=body,
        )
    except ValueError as exc:
        if "not found in this workspace" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The AI Asset Studio request could not be completed",
        ) from exc

    return ConsoleTurnResponse(
        conversation=ConversationResponse.model_validate(result.conversation),
        user_message=ConversationMessageResponse.model_validate(result.user_message),
        assistant_message=ConversationMessageResponse.model_validate(
            result.assistant_message
        ),
        run=WorkflowRunResponse.model_validate(result.run),
        steps=[
            WorkflowStepResponse.model_validate(step) for step in result.steps
        ],
        artifacts=[
            await _artifact_response(artifact) for artifact in result.artifacts
        ],
        ui_intents=result.ui_intents,
        recommended_actions=result.recommended_actions,
    )


@router.get(
    "/projects/{project_id}/conversations",
    response_model=list[ConversationResponse],
)
async def list_conversations(
    project_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[ConversationResponse]:
    user_id = uuid.UUID(user["user_id"])
    await _owned_project(project_id, user_id, db)
    conversations = (
        await db.scalars(
            select(Conversation)
            .where(
                Conversation.project_id == project_id,
                Conversation.owner_id == user_id,
            )
            .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
            .limit(limit)
        )
    ).all()
    return [
        ConversationResponse.model_validate(conversation)
        for conversation in conversations
    ]


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ConversationMessageResponse],
)
async def list_conversation_messages(
    conversation_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(default=100, ge=1, le=200),
) -> list[ConversationMessageResponse]:
    user_id = uuid.UUID(user["user_id"])
    await _owned_conversation(conversation_id, user_id, db)
    messages = (
        await db.scalars(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(
                ConversationMessage.created_at.asc(),
                ConversationMessage.id.asc(),
            )
            .limit(limit)
        )
    ).all()
    return [
        ConversationMessageResponse.model_validate(message) for message in messages
    ]


@router.get(
    "/projects/{project_id}/artifacts",
    response_model=list[ArtifactResponse],
)
async def list_artifacts(
    project_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=100),
) -> list[ArtifactResponse]:
    user_id = uuid.UUID(user["user_id"])
    await _owned_project(project_id, user_id, db)
    artifacts = (
        await db.scalars(
            select(Artifact)
            .where(Artifact.project_id == project_id)
            .order_by(Artifact.updated_at.desc(), Artifact.id.desc())
            .limit(limit)
        )
    ).all()
    return list(await asyncio.gather(*(_artifact_response(value) for value in artifacts)))


@router.get(
    "/projects/{project_id}/runs",
    response_model=list[WorkflowRunResponse],
)
async def list_workflow_runs(
    project_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(default=30, ge=1, le=100),
) -> list[WorkflowRunResponse]:
    user_id = uuid.UUID(user["user_id"])
    await _owned_project(project_id, user_id, db)
    runs = (
        await db.scalars(
            select(WorkflowRun)
            .where(WorkflowRun.project_id == project_id)
            .order_by(WorkflowRun.created_at.desc(), WorkflowRun.id.desc())
            .limit(limit)
        )
    ).all()
    return [WorkflowRunResponse.model_validate(run) for run in runs]


@router.get(
    "/runs/{run_id}/steps",
    response_model=list[WorkflowStepResponse],
)
async def list_workflow_steps(
    run_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
) -> list[WorkflowStepResponse]:
    user_id = uuid.UUID(user["user_id"])
    await _owned_run(run_id, user_id, db)
    steps = (
        await db.scalars(
            select(WorkflowStep)
            .where(WorkflowStep.run_id == run_id)
            .order_by(WorkflowStep.sequence.asc(), WorkflowStep.id.asc())
        )
    ).all()
    return [WorkflowStepResponse.model_validate(step) for step in steps]


@router.get(
    "/projects/{project_id}/events",
    response_model=WorkspaceEventPage,
)
async def list_workspace_events(
    project_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = Query(default=None),
) -> WorkspaceEventPage:
    user_id = uuid.UUID(user["user_id"])
    await _owned_project(project_id, user_id, db)
    query = select(WorkspaceEvent).where(WorkspaceEvent.project_id == project_id)
    if cursor:
        cursor_time, cursor_id = _decode_cursor(cursor)
        query = query.where(
            WorkspaceEvent.id != cursor_id,
            or_(
                WorkspaceEvent.created_at < cursor_time,
                and_(
                    WorkspaceEvent.created_at == cursor_time,
                    WorkspaceEvent.id < cursor_id,
                ),
            )
        )
    events = (
        await db.scalars(
            query.order_by(
                WorkspaceEvent.created_at.desc(),
                WorkspaceEvent.id.desc(),
            ).limit(limit + 1)
        )
    ).all()
    has_more = len(events) > limit
    page = list(events[:limit])
    next_cursor = _encode_cursor(page[-1]) if has_more and page else None
    return WorkspaceEventPage(
        events=[
            WorkspaceEventResponse.model_validate(event) for event in page
        ],
        next_cursor=next_cursor,
    )


def _encode_cursor(event: WorkspaceEvent) -> str:
    value = f"{event.created_at.isoformat()}|{event.id}"
    return base64.urlsafe_b64encode(value.encode()).decode().rstrip("=")


def _decode_cursor(value: str) -> tuple[datetime, uuid.UUID]:
    try:
        padded = value + "=" * (-len(value) % 4)
        decoded = base64.urlsafe_b64decode(padded).decode()
        timestamp, event_id = decoded.rsplit("|", 1)
        parsed_time = datetime.fromisoformat(timestamp)
        return parsed_time, uuid.UUID(event_id)
    except (binascii.Error, ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid event cursor",
        ) from exc
