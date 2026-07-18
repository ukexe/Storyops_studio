from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


class TaskResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    linked_item_id: uuid.UUID | None
    linked_item_title: str | None = None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskStatusUpdate(BaseModel):
    status: TaskStatus | None = None
    priority: TaskPriority | None = None

    @model_validator(mode="after")
    def require_update(self):
        if self.status is None and self.priority is None:
            raise ValueError("status or priority must be provided")
        return self
