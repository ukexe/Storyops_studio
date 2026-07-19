"""enhance StoryOps asset studio

Revision ID: 73ff11ca1f26
Revises: 7e34a290f9de
Create Date: 2026-07-19 13:56:35.611699

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "73ff11ca1f26"
down_revision: str | None = "7e34a290f9de"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "workflow_runs",
        sa.Column(
            "replayed_from_run_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.add_column(
        "workflow_runs",
        sa.Column("model_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "workflow_runs",
        sa.Column("prompt_version", sa.String(100), nullable=True),
    )
    op.create_foreign_key(
        "fk_workflow_runs_replayed_from_run",
        "workflow_runs",
        "workflow_runs",
        ["replayed_from_run_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_workflow_runs_replayed_from_run_id",
        "workflow_runs",
        ["replayed_from_run_id"],
    )

    op.add_column(
        "artifacts",
        sa.Column(
            "run_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.add_column(
        "artifacts",
        sa.Column(
            "format",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'markdown'"),
        ),
    )
    op.add_column(
        "artifacts",
        sa.Column("mime_type", sa.String(255), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column("storage_path", sa.String(2048), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column("model_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column("content_sha256", sa.String(64), nullable=True),
    )
    op.create_foreign_key(
        "fk_artifacts_run_id",
        "artifacts",
        "workflow_runs",
        ["run_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        "ck_artifacts_format",
        "artifacts",
        "format IN ('markdown','mermaid','code','json','image','text')",
    )
    op.create_check_constraint(
        "ck_artifacts_storage_shape",
        "artifacts",
        "((format = 'image' AND storage_path IS NOT NULL "
        "AND mime_type LIKE 'image/%') OR "
        "(format <> 'image' AND storage_path IS NULL))",
    )
    op.create_index("ix_artifacts_run_id", "artifacts", ["run_id"])
    op.create_index(
        "uq_artifacts_storage_path",
        "artifacts",
        ["storage_path"],
        unique=True,
        postgresql_where=sa.text("storage_path IS NOT NULL"),
    )
    op.execute(
        sa.text(
            """
            UPDATE public.artifacts
            SET
              model_id = NULLIF(metadata->>'model_id', ''),
              run_id = CASE
                WHEN COALESCE(metadata->>'run_id', '') ~*
                  '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                THEN (metadata->>'run_id')::uuid
                ELSE NULL
              END
            """
        )
    )

    # Runtime services append and read events. Historical correction must happen
    # through a forward migration, never through application UPDATE/DELETE calls.
    op.execute(
        sa.text(
            "REVOKE UPDATE, DELETE ON TABLE public.workspace_events FROM service_role"
        )
    )
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'storyops_app') THEN
                REVOKE UPDATE, DELETE ON TABLE public.workspace_events
                  FROM storyops_app;
              END IF;
            END
            $$;
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "GRANT UPDATE, DELETE ON TABLE public.workspace_events TO service_role"
        )
    )
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'storyops_app') THEN
                GRANT UPDATE, DELETE ON TABLE public.workspace_events
                  TO storyops_app;
              END IF;
            END
            $$;
            """
        )
    )

    op.drop_index(
        "uq_artifacts_storage_path",
        table_name="artifacts",
    )
    op.drop_index("ix_artifacts_run_id", table_name="artifacts")
    op.drop_constraint("ck_artifacts_storage_shape", "artifacts", type_="check")
    op.drop_constraint("ck_artifacts_format", "artifacts", type_="check")
    op.drop_constraint("fk_artifacts_run_id", "artifacts", type_="foreignkey")
    op.drop_column("artifacts", "content_sha256")
    op.drop_column("artifacts", "model_id")
    op.drop_column("artifacts", "storage_path")
    op.drop_column("artifacts", "mime_type")
    op.drop_column("artifacts", "format")
    op.drop_column("artifacts", "run_id")

    op.drop_index(
        "ix_workflow_runs_replayed_from_run_id",
        table_name="workflow_runs",
    )
    op.drop_constraint(
        "fk_workflow_runs_replayed_from_run",
        "workflow_runs",
        type_="foreignkey",
    )
    op.drop_column("workflow_runs", "prompt_version")
    op.drop_column("workflow_runs", "model_id")
    op.drop_column("workflow_runs", "replayed_from_run_id")
