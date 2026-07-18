from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.constants import ITEM_TYPES, PIPELINE_STAGES
from app.schemas.analysis import AnalysisResponse

MAX_CONTENT_LENGTH = 200_000
MAX_METADATA_BYTES = 50_000
MAX_METADATA_DEPTH = 8


class ItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str
    type: str
    title: str = Field(min_length=1, max_length=500)
    content: str | None = Field(default=None, max_length=MAX_CONTENT_LENGTH)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: str) -> str:
        if v not in PIPELINE_STAGES:
            raise ValueError(f"stage must be one of {PIPELINE_STAGES}, got '{v}'")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ITEM_TYPES:
            raise ValueError(f"type must be one of {ITEM_TYPES}, got '{v}'")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("title cannot be blank")
        return value

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, value: dict[str, Any]) -> dict[str, Any]:
        return _validate_metadata(value)

    @model_validator(mode="after")
    def validate_type_specific_input(self):
        if self.type in {"brief", "script", "feedback"} and not (
            self.content and self.content.strip()
        ):
            raise ValueError(f"{self.type} items require text content")
        if self.type in {"edit", "metric"} and not self.metadata:
            raise ValueError(f"{self.type} items require structured metadata")
        return self


class ItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str | None = None
    title: str | None = Field(default=None, max_length=500)
    content: str | None = Field(default=None, max_length=MAX_CONTENT_LENGTH)
    metadata: dict[str, Any] | None = None

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: str | None) -> str | None:
        if v is None:
            raise ValueError("stage cannot be null")
        if v not in PIPELINE_STAGES:
            raise ValueError(f"stage must be one of {PIPELINE_STAGES}, got '{v}'")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            raise ValueError("title cannot be null or blank")
        return v.strip()

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        if v is None:
            raise ValueError("metadata cannot be null")
        return _validate_metadata(v)


class ItemResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    stage: str
    type: str
    title: str
    content: str | None
    file_url: str | None
    metadata: dict[str, Any] = Field(validation_alias="item_metadata")
    created_at: datetime
    updated_at: datetime
    latest_analysis: AnalysisResponse | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


def _validate_metadata(value: dict[str, Any]) -> dict[str, Any]:
    if len(json.dumps(value, separators=(",", ":")).encode("utf-8")) > MAX_METADATA_BYTES:
        raise ValueError("metadata exceeds the 50 KB limit")
    if _metadata_depth(value) > MAX_METADATA_DEPTH:
        raise ValueError("metadata nesting exceeds the supported depth")
    return value


def _metadata_depth(value: Any, depth: int = 0) -> int:
    if isinstance(value, dict):
        return max(
            (_metadata_depth(item, depth + 1) for item in value.values()),
            default=depth,
        )
    if isinstance(value, list):
        return max(
            (_metadata_depth(item, depth + 1) for item in value),
            default=depth,
        )
    return depth
