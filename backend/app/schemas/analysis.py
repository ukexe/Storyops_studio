from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    title: str
    detail: str
    priority: Literal["low", "medium", "high"]


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    agent_type: str
    summary: str
    recommendations: list[RecommendationResponse]
    score_metrics: dict[str, Any]
    model_id: str
    created_at: datetime

    model_config = {"from_attributes": True}
