from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.constants import ITEM_TYPES, PIPELINE_STAGES
from app.schemas.analysis import AnalysisResponse


class ItemCreate(BaseModel):
    stage: str
    type: str
    title: str = Field(min_length=1, max_length=500)
    content: str | None = None
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


class ItemUpdate(BaseModel):
    stage: str | None = None
    title: str | None = Field(default=None, max_length=500)
    content: str | None = None
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
        return v


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
