"""Integration tests for the one-click StoryOps demo seed."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.agents import asset_agent as asset_agent_module
from app.agents import dispatcher as dispatcher_module
from app.models.analysis import Analysis
from app.models.item import Item
from app.models.project import Project
from app.models.task import Task
from app.routers import demo as demo_module


@pytest.mark.asyncio
async def test_demo_seed_creates_analyzed_project(
    client,
    db_session,
    monkeypatch,
):
    uploaded: dict[str, object] = {}

    def fake_upload(project_id: str, filename: str, data: bytes) -> str:
        uploaded.update(
            project_id=project_id,
            filename=filename,
            byte_count=len(data),
        )
        return f"https://storage.example.test/{project_id}/{filename}"

    monkeypatch.setattr(demo_module, "upload_asset", fake_upload)
    monkeypatch.setattr(
        asset_agent_module,
        "_fetch_image_bytes",
        AsyncMock(return_value=b"\xff\xd8\xffdemo-thumbnail"),
    )

    watsonx_client = AsyncMock()
    watsonx_client.generate_text.side_effect = [
        """
        {
          "objectives": ["Explain AI-assisted creative operations"],
          "constraints": ["Three-minute runtime"],
          "missing_info": ["Confirm distribution channel", "Add a CTA"],
          "clarity_score": 7
        }
        """,
        """
        {
          "hook_strength": 4,
          "pacing_notes": ["Open with a concrete audience consequence"],
          "cta_present": false,
          "retention_risk": "high",
          "improvements": [
            {
              "title": "Strengthen the hook",
              "detail": "Lead with the cost of fragmented creative work."
            }
          ]
        }
        """,
    ]
    watsonx_client.analyze_image.return_value = """
    {
      "brand_consistency": 6,
      "logo_integrity": "flag",
      "issues": [
        {
          "element": "Logo mark",
          "description": "The circular mark appears horizontally stretched.",
          "severity": "high"
        }
      ]
    }
    """
    monkeypatch.setattr(dispatcher_module, "get_client", lambda: watsonx_client)

    response = await client.post("/api/v1/demo/seed")

    assert response.status_code == 201
    project_id = response.json()["project_id"]
    assert uploaded["project_id"] == project_id
    assert uploaded["filename"] == "sample-thumbnail.jpg"
    assert uploaded["byte_count"] > 0

    project_uuid = uuid.UUID(project_id)
    project = await db_session.scalar(select(Project).where(Project.id == project_uuid))
    items = (
        await db_session.execute(select(Item).where(Item.project_id == project_uuid))
    ).scalars().all()
    item_ids = [item.id for item in items]
    analyses = (
        await db_session.execute(
            select(Analysis).where(Analysis.item_id.in_(item_ids))
        )
    ).scalars().all()
    tasks = (
        await db_session.execute(select(Task).where(Task.project_id == project_uuid))
    ).scalars().all()

    assert project is not None
    assert project.name == "YouTube Series — AI Explained"
    assert str(project.owner_id) == "00000000-0000-0000-0000-000000000001"
    assert len(items) == 4
    assert {item.type for item in items} == {"brief", "script", "asset", "feedback"}
    assert len(analyses) == 3
    assert {analysis.agent_type for analysis in analyses} == {
        "brief",
        "script",
        "asset",
    }
    assert len(tasks) == 4

    project_response = await client.get(f"/api/v1/projects/{project_id}")
    items_response = await client.get(f"/api/v1/projects/{project_id}/items")
    tasks_response = await client.get(f"/api/v1/projects/{project_id}/tasks")
    assert project_response.status_code == 200
    assert items_response.status_code == 200
    assert tasks_response.status_code == 200

    repeated_response = await client.post("/api/v1/demo/seed")
    assert repeated_response.status_code == 201
    assert repeated_response.json()["project_id"] == project_id
    assert watsonx_client.generate_text.await_count == 2
    assert watsonx_client.analyze_image.await_count == 1
