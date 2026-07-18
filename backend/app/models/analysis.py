from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, new_uuid

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=new_uuid,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    # Array of {title, detail, priority} — JSON renders as JSONB on Postgres, TEXT on SQLite
    recommendations: Mapped[list] = mapped_column(
        JSON_TYPE, nullable=False, default=list
    )
    # Flexible dict of numeric scores (hook_strength, clarity_score, etc.)
    score_metrics: Mapped[dict] = mapped_column(
        JSON_TYPE, nullable=False, default=dict
    )
    # Fully-qualified Granite model ID — audit trail for judges
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
