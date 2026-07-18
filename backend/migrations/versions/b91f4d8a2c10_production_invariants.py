"""add production defaults and invariants

Revision ID: b91f4d8a2c10
Revises: a4b7c2d9e001
Create Date: 2026-07-18
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b91f4d8a2c10"
down_revision: str | None = "a4b7c2d9e001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in ("projects", "items", "analyses", "tasks"):
        op.alter_column(
            table,
            "id",
            server_default=sa.text("gen_random_uuid()"),
        )

    op.execute("UPDATE storage.buckets SET public = false WHERE id = 'assets'")

    op.add_column("projects", sa.Column("demo_version", sa.String(50), nullable=True))
    op.create_index(
        "uq_projects_owner_demo_version",
        "projects",
        ["owner_id", "demo_version"],
        unique=True,
        postgresql_where=sa.text("demo_version IS NOT NULL"),
    )

    op.execute(
        sa.text(
            """
            CREATE OR REPLACE FUNCTION public.storyops_set_updated_at()
            RETURNS trigger
            LANGUAGE plpgsql
            SET search_path = ''
            AS $$
            BEGIN
              NEW.updated_at = now();
              RETURN NEW;
            END;
            $$
            """
        )
    )
    for table in ("projects", "items", "tasks"):
        op.execute(
            sa.text(
                f"""
                CREATE TRIGGER storyops_{table}_updated_at
                BEFORE UPDATE ON public.{table}
                FOR EACH ROW EXECUTE FUNCTION public.storyops_set_updated_at()
                """
            )
        )

    op.execute(
        sa.text(
            """
            CREATE OR REPLACE FUNCTION public.storyops_validate_task_item()
            RETURNS trigger
            LANGUAGE plpgsql
            SET search_path = ''
            AS $$
            BEGIN
              IF NEW.linked_item_id IS NOT NULL AND NOT EXISTS (
                SELECT 1
                FROM public.items
                WHERE id = NEW.linked_item_id
                  AND project_id = NEW.project_id
              ) THEN
                RAISE EXCEPTION 'linked item must belong to the task project';
              END IF;
              RETURN NEW;
            END;
            $$
            """
        )
    )
    op.execute(
        sa.text(
            """
            CREATE TRIGGER storyops_tasks_validate_item
            BEFORE INSERT OR UPDATE OF linked_item_id, project_id
            ON public.tasks
            FOR EACH ROW EXECUTE FUNCTION public.storyops_validate_task_item()
            """
        )
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS storyops_tasks_validate_item ON public.tasks")
    op.execute("DROP FUNCTION IF EXISTS public.storyops_validate_task_item()")
    for table in ("projects", "items", "tasks"):
        op.execute(
            f"DROP TRIGGER IF EXISTS storyops_{table}_updated_at ON public.{table}"
        )
    op.execute("DROP FUNCTION IF EXISTS public.storyops_set_updated_at()")
    op.drop_index("uq_projects_owner_demo_version", table_name="projects")
    op.drop_column("projects", "demo_version")
    op.execute("UPDATE storage.buckets SET public = true WHERE id = 'assets'")
    for table in ("projects", "items", "analyses", "tasks"):
        op.alter_column(table, "id", server_default=None)
