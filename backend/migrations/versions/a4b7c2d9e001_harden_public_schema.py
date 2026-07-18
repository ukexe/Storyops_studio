"""harden public schema

Revision ID: a4b7c2d9e001
Revises: 5b7c79ddcdad
Create Date: 2026-07-18
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a4b7c2d9e001"
down_revision: str | None = "5b7c79ddcdad"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = ("projects", "items", "analyses", "tasks")


def upgrade() -> None:
    for table in TABLES:
        op.execute(sa.text(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY'))

    # FastAPI owns all database access. Browser roles must not bypass its
    # ownership checks through Supabase's public Data API.
    op.execute(
        sa.text(
            "REVOKE ALL PRIVILEGES ON TABLE public.projects, public.items, "
            "public.analyses, public.tasks FROM anon, authenticated"
        )
    )
    op.execute(
        sa.text(
            "INSERT INTO storage.buckets "
            "(id, name, public, file_size_limit, allowed_mime_types) VALUES "
            "('assets', 'assets', true, 10485760, "
            "ARRAY['image/jpeg','image/png','image/gif','image/webp']) "
            "ON CONFLICT (id) DO UPDATE SET "
            "public = EXCLUDED.public, "
            "file_size_limit = EXCLUDED.file_size_limit, "
            "allowed_mime_types = EXCLUDED.allowed_mime_types"
        )
    )

    op.create_check_constraint(
        "ck_items_stage",
        "items",
        "stage IN ('Idea','Script','Assets','Edit','Feedback','Publish','Analyze')",
    )
    op.create_check_constraint(
        "ck_items_type",
        "items",
        "type IN ('brief','script','asset','edit','feedback','metric')",
    )
    op.create_check_constraint(
        "ck_tasks_status",
        "tasks",
        "status IN ('todo','in_progress','done')",
    )
    op.create_check_constraint(
        "ck_tasks_priority",
        "tasks",
        "priority IN ('low','medium','high')",
    )
    op.create_index("ix_tasks_linked_item_id", "tasks", ["linked_item_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_linked_item_id", table_name="tasks")
    op.drop_constraint("ck_tasks_priority", "tasks", type_="check")
    op.drop_constraint("ck_tasks_status", "tasks", type_="check")
    op.drop_constraint("ck_items_type", "items", type_="check")
    op.drop_constraint("ck_items_stage", "items", type_="check")
    for table in TABLES:
        op.execute(sa.text(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY'))
