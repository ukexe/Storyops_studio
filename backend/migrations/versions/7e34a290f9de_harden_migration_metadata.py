"""harden migration metadata

Revision ID: 7e34a290f9de
Revises: 4e0683f5a3ed
Create Date: 2026-07-19 11:27:53.217148

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "7e34a290f9de"
down_revision: str | None = "4e0683f5a3ed"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Supabase exposes the public schema through PostgREST. Alembic's metadata
    # table is operational state, not an application API, so protect it with the
    # same deny-by-default boundary as application tables.
    op.execute(
        sa.text("ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY")
    )
    op.execute(
        sa.text(
            "REVOKE ALL PRIVILEGES ON TABLE public.alembic_version "
            "FROM PUBLIC, anon, authenticated"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text("ALTER TABLE public.alembic_version DISABLE ROW LEVEL SECURITY")
    )
