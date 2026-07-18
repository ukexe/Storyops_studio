# backend/app/models/__init__.py
# All models imported here so Alembic autogenerate detects them and
# so callers can do: from app.models import Project, Item, Analysis, Task

from app.models.base import Base
from app.models.project import Project
from app.models.item import Item
from app.models.analysis import Analysis
from app.models.task import Task

__all__ = ["Base", "Project", "Item", "Analysis", "Task"]
