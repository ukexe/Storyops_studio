from __future__ import annotations

import uuid

from sqlalchemy import (
    JSON,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_uuid

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class Artifact(Base, TimestampMixin):
    __tablename__ = "artifacts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=new_uuid,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_message_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("conversation_messages.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    format: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="markdown",
    )
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )
    model_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    artifact_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSON_TYPE,
        nullable=False,
        default=dict,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ready",
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','ready','approved','archived')",
            name="ck_artifacts_status",
        ),
        CheckConstraint(
            "version > 0",
            name="ck_artifacts_version",
        ),
        CheckConstraint(
            "format IN ('markdown','mermaid','code','json','image','text')",
            name="ck_artifacts_format",
        ),
        CheckConstraint(
            "((format = 'image' AND storage_path IS NOT NULL "
            "AND mime_type LIKE 'image/%') OR "
            "(format <> 'image' AND storage_path IS NULL))",
            name="ck_artifacts_storage_shape",
        ),
        Index("ix_artifacts_project_updated", "project_id", "updated_at"),
        Index("ix_artifacts_project_type", "project_id", "type"),
        Index(
            "uq_artifacts_storage_path",
            "storage_path",
            unique=True,
            postgresql_where=text("storage_path IS NOT NULL"),
        ),
    )
