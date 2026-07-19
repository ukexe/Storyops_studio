from __future__ import annotations

import uuid
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace_event import WorkspaceEvent

EventSource = Literal["user", "agent", "tool", "workflow", "system"]


async def record_workspace_event(
    db: AsyncSession,
    *,
    project_id: uuid.UUID,
    event_type: str,
    source: EventSource,
    object_type: str,
    title: str,
    actor_id: uuid.UUID | None = None,
    object_id: uuid.UUID | None = None,
    run_id: uuid.UUID | None = None,
    artifact_id: uuid.UUID | None = None,
    causation_id: uuid.UUID | None = None,
    correlation_id: uuid.UUID | None = None,
    summary: str | None = None,
    payload: dict[str, Any] | None = None,
    model_id: str | None = None,
    is_reversible: bool = False,
    flush: bool = True,
) -> WorkspaceEvent:
    """Append one immutable, correlation-aware workspace event.

    Transaction ownership remains with the caller so the event and the domain
    mutation can commit or roll back together.
    """
    event = WorkspaceEvent(
        project_id=project_id,
        actor_id=actor_id,
        run_id=run_id,
        artifact_id=artifact_id,
        causation_id=causation_id,
        correlation_id=correlation_id or uuid.uuid4(),
        event_type=event_type[:150],
        source=source,
        object_type=object_type[:100],
        object_id=object_id,
        title=title.strip()[:500],
        summary=summary.strip() if summary else None,
        event_payload=payload or {},
        model_id=model_id[:255] if model_id else None,
        is_reversible=is_reversible,
    )
    db.add(event)
    if flush:
        await db.flush()
    return event
