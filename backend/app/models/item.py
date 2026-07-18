from __future__ import annotations

import uuid

from sqlalchemy import JSON, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_uuid

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class Item(Base, TimestampMixin):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=new_uuid,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # One of PIPELINE_STAGES — validated at the schema layer, not enforced by a FK
    stage: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # One of ITEM_TYPES
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # Flexible structured metadata (content_type, scenes, etc.)
    # Named `item_metadata` to avoid collision with SQLAlchemy's reserved `metadata` attr.
    # JSON renders as JSONB on Postgres and as TEXT on SQLite (for tests).
    item_metadata: Mapped[dict] = mapped_column(
        "metadata", JSON_TYPE, nullable=False, default=dict
    )

    __table_args__ = (
        Index("ix_items_project_stage", "project_id", "stage"),
    )
