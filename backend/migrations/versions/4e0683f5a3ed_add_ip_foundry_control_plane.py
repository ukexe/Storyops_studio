"""add IP Foundry control plane

Revision ID: 4e0683f5a3ed
Revises: b91f4d8a2c10
Create Date: 2026-07-19 09:04:58.041653

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "4e0683f5a3ed"
down_revision: str | None = "b91f4d8a2c10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CONTROL_PLANE_TABLES = (
    "conversations",
    "workflow_runs",
    "workflow_steps",
    "conversation_messages",
    "artifacts",
    "workspace_events",
)


def _uuid_column(name: str, *, nullable: bool = False) -> sa.Column:
    return sa.Column(
        name,
        postgresql.UUID(as_uuid=True),
        nullable=nullable,
    )


def _id_column() -> sa.Column:
    return sa.Column(
        "id",
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )


def _created_at_column() -> sa.Column:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )


def _updated_at_column() -> sa.Column:
    return sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )


def upgrade() -> None:
    op.create_table(
        "conversations",
        _id_column(),
        _uuid_column("project_id"),
        _uuid_column("owner_id"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'active'"),
        ),
        sa.Column(
            "context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        _created_at_column(),
        _updated_at_column(),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "status IN ('active','archived')",
            name="ck_conversations_status",
        ),
    )
    op.create_index(
        "ix_conversations_project_updated",
        "conversations",
        ["project_id", sa.text("updated_at DESC")],
    )
    op.create_index(
        "ix_conversations_owner_id",
        "conversations",
        ["owner_id"],
    )

    op.create_table(
        "workflow_runs",
        _id_column(),
        _uuid_column("project_id"),
        _uuid_column("conversation_id", nullable=True),
        sa.Column("run_type", sa.String(100), nullable=False),
        sa.Column("objective", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'queued'"),
        ),
        sa.Column(
            "progress",
            sa.SmallInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("current_agent", sa.String(100), nullable=True),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column(
            "context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        _created_at_column(),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint(
            "status IN "
            "('queued','running','paused','waiting_approval','completed',"
            "'failed','cancelled')",
            name="ck_workflow_runs_status",
        ),
        sa.CheckConstraint(
            "progress BETWEEN 0 AND 100",
            name="ck_workflow_runs_progress",
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_workflow_runs_confidence",
        ),
    )
    op.create_index(
        "ix_workflow_runs_project_created",
        "workflow_runs",
        ["project_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_workflow_runs_conversation_id",
        "workflow_runs",
        ["conversation_id"],
    )
    op.create_index(
        "ix_workflow_runs_project_status",
        "workflow_runs",
        ["project_id", "status"],
    )

    op.create_table(
        "workflow_steps",
        _id_column(),
        _uuid_column("run_id"),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("agent_type", sa.String(100), nullable=False),
        sa.Column("tool_name", sa.String(150), nullable=True),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column(
            "input_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "output_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column(
            "dependencies",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        _created_at_column(),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["workflow_runs.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "run_id",
            "sequence",
            name="uq_workflow_steps_run_sequence",
        ),
        sa.CheckConstraint(
            "sequence >= 0",
            name="ck_workflow_steps_sequence",
        ),
        sa.CheckConstraint(
            "status IN "
            "('pending','running','waiting_approval','completed','failed','skipped')",
            name="ck_workflow_steps_status",
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_workflow_steps_confidence",
        ),
    )
    op.create_index(
        "ix_workflow_steps_run_id",
        "workflow_steps",
        ["run_id"],
    )

    op.create_table(
        "conversation_messages",
        _id_column(),
        _uuid_column("conversation_id"),
        _uuid_column("run_id", nullable=True),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("agent_type", sa.String(100), nullable=True),
        sa.Column("model_id", sa.String(255), nullable=True),
        sa.Column(
            "tool_calls",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        _created_at_column(),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["workflow_runs.id"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint(
            "role IN ('user','assistant','tool','system')",
            name="ck_conversation_messages_role",
        ),
    )
    op.create_index(
        "ix_conversation_messages_conversation_created",
        "conversation_messages",
        ["conversation_id", "created_at"],
    )
    op.create_index(
        "ix_conversation_messages_run_id",
        "conversation_messages",
        ["run_id"],
    )

    op.create_table(
        "artifacts",
        _id_column(),
        _uuid_column("project_id"),
        _uuid_column("conversation_id", nullable=True),
        _uuid_column("source_message_id", nullable=True),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'ready'"),
        ),
        sa.Column(
            "version",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        _created_at_column(),
        _updated_at_column(),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["source_message_id"],
            ["conversation_messages.id"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint(
            "status IN ('draft','ready','approved','archived')",
            name="ck_artifacts_status",
        ),
        sa.CheckConstraint(
            "version > 0",
            name="ck_artifacts_version",
        ),
    )
    op.create_index(
        "ix_artifacts_project_updated",
        "artifacts",
        ["project_id", sa.text("updated_at DESC")],
    )
    op.create_index(
        "ix_artifacts_conversation_id",
        "artifacts",
        ["conversation_id"],
    )
    op.create_index(
        "ix_artifacts_source_message_id",
        "artifacts",
        ["source_message_id"],
    )
    op.create_index(
        "ix_artifacts_project_type",
        "artifacts",
        ["project_id", "type"],
    )

    op.create_table(
        "workspace_events",
        _id_column(),
        _uuid_column("project_id"),
        _uuid_column("actor_id", nullable=True),
        _uuid_column("run_id", nullable=True),
        _uuid_column("artifact_id", nullable=True),
        _uuid_column("causation_id", nullable=True),
        sa.Column(
            "correlation_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("event_type", sa.String(150), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
        sa.Column("object_type", sa.String(100), nullable=False),
        _uuid_column("object_id", nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("model_id", sa.String(255), nullable=True),
        sa.Column(
            "is_reversible",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        _created_at_column(),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["workflow_runs.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["artifact_id"],
            ["artifacts.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["causation_id"],
            ["workspace_events.id"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint(
            "source IN ('user','agent','tool','workflow','system')",
            name="ck_workspace_events_source",
        ),
    )
    op.create_index(
        "ix_workspace_events_project_created",
        "workspace_events",
        ["project_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_workspace_events_project_type_created",
        "workspace_events",
        ["project_id", "event_type", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_workspace_events_correlation_id",
        "workspace_events",
        ["correlation_id"],
    )
    op.create_index(
        "ix_workspace_events_run_id",
        "workspace_events",
        ["run_id"],
    )
    op.create_index(
        "ix_workspace_events_artifact_id",
        "workspace_events",
        ["artifact_id"],
    )
    op.create_index(
        "ix_workspace_events_causation_id",
        "workspace_events",
        ["causation_id"],
    )

    for table in ("conversations", "artifacts"):
        op.execute(
            sa.text(
                f"""
                CREATE TRIGGER storyops_{table}_updated_at
                BEFORE UPDATE ON public.{table}
                FOR EACH ROW EXECUTE FUNCTION public.storyops_set_updated_at()
                """
            )
        )

    for table in CONTROL_PLANE_TABLES:
        op.execute(sa.text(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY"))

    table_list = ", ".join(f"public.{table}" for table in CONTROL_PLANE_TABLES)
    op.execute(
        sa.text(
            f"REVOKE ALL PRIVILEGES ON TABLE {table_list} FROM anon, authenticated"
        )
    )
    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_list} "
            "TO service_role"
        )
    )
    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'storyops_app') THEN
                EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
                  {table_list} TO storyops_app';
              END IF;
            END
            $$;
            """
        )
    )


def downgrade() -> None:
    for table in ("artifacts", "conversations"):
        op.execute(
            f"DROP TRIGGER IF EXISTS storyops_{table}_updated_at ON public.{table}"
        )
    for table in reversed(CONTROL_PLANE_TABLES):
        op.drop_table(table)
