from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_CONSOLE_MESSAGE_LENGTH = 20_000
MAX_CONSOLE_CONTEXT_BYTES = 20_000

ConversationStatus = Literal["active", "archived"]
MessageRole = Literal["user", "assistant", "tool", "system"]
RunStatus = Literal[
    "queued",
    "running",
    "paused",
    "waiting_approval",
    "completed",
    "failed",
    "cancelled",
]
StepStatus = Literal[
    "pending",
    "running",
    "waiting_approval",
    "completed",
    "failed",
    "skipped",
]
ArtifactStatus = Literal["draft", "ready", "approved", "archived"]
ArtifactFormat = Literal["markdown", "mermaid", "code", "json", "image", "text"]
EventSource = Literal["user", "agent", "tool", "workflow", "system"]


class ConsoleTurnCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=MAX_CONSOLE_MESSAGE_LENGTH)
    conversation_id: uuid.UUID | None = None
    replay_from_run_id: uuid.UUID | None = None
    replay_from_event_id: uuid.UUID | None = None
    context: dict[str, Any] = Field(default_factory=dict)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message cannot be blank")
        return value

    @field_validator("context")
    @classmethod
    def validate_context(cls, value: dict[str, Any]) -> dict[str, Any]:
        encoded = json.dumps(value, separators=(",", ":"), default=str).encode()
        if len(encoded) > MAX_CONSOLE_CONTEXT_BYTES:
            raise ValueError("context exceeds the 20 KB limit")
        return value


class ConversationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    status: ConversationStatus
    context: dict[str, Any] = Field(validation_alias="conversation_context")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ConversationMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    run_id: uuid.UUID | None
    role: MessageRole
    content: str
    agent_type: str | None
    model_id: str | None
    tool_calls: list[dict[str, Any]]
    metadata: dict[str, Any] = Field(validation_alias="message_metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WorkflowStepResponse(BaseModel):
    id: uuid.UUID
    run_id: uuid.UUID
    sequence: int
    agent_type: str
    tool_name: str | None
    status: StepStatus
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    confidence: float | None
    dependencies: list[str]
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowRunResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    conversation_id: uuid.UUID | None
    replayed_from_run_id: uuid.UUID | None
    run_type: str
    objective: str
    status: RunStatus
    progress: int
    current_agent: str | None
    model_id: str | None
    prompt_version: str | None
    confidence: float | None
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ArtifactResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    conversation_id: uuid.UUID | None
    source_message_id: uuid.UUID | None
    run_id: uuid.UUID | None
    type: str
    title: str
    content: str
    format: ArtifactFormat
    mime_type: str | None
    storage_path: str | None
    content_url: str | None = None
    model_id: str | None
    content_sha256: str | None
    metadata: dict[str, Any] = Field(validation_alias="artifact_metadata")
    status: ArtifactStatus
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WorkspaceEventResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    actor_id: uuid.UUID | None
    run_id: uuid.UUID | None
    artifact_id: uuid.UUID | None
    causation_id: uuid.UUID | None
    correlation_id: uuid.UUID
    event_type: str
    source: EventSource
    object_type: str
    object_id: uuid.UUID | None
    title: str
    summary: str | None
    payload: dict[str, Any] = Field(validation_alias="event_payload")
    model_id: str | None
    is_reversible: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WorkspaceEventPage(BaseModel):
    events: list[WorkspaceEventResponse]
    next_cursor: str | None = None


class UIIntent(BaseModel):
    type: Literal["navigate", "highlight", "refresh"]
    target: str
    label: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConsoleTurnResponse(BaseModel):
    conversation: ConversationResponse
    user_message: ConversationMessageResponse
    assistant_message: ConversationMessageResponse
    run: WorkflowRunResponse
    steps: list[WorkflowStepResponse]
    artifacts: list[ArtifactResponse]
    ui_intents: list[UIIntent]
    recommended_actions: list[str]
