"""Tests for pipeline stage validation — T1.9."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_create_item_valid_stage(client):
    """POST /projects/{id}/items with a valid stage succeeds."""
    # First create a project
    proj_resp = await client.post("/api/v1/projects/", json={"name": "Stage Test Project"})
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/projects/{project_id}/items",
        data={
            "stage": "Script",
            "type": "script",
            "title": "My Script",
            "content": "This is the script content.",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["stage"] == "Script"
    assert data["type"] == "script"
    assert data["title"] == "My Script"


@pytest.mark.asyncio
async def test_create_item_invalid_stage(client):
    """POST /projects/{id}/items with an invalid stage returns 422."""
    proj_resp = await client.post("/api/v1/projects/", json={"name": "Invalid Stage Project"})
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/projects/{project_id}/items",
        data={
            "stage": "NotAStage",
            "type": "brief",
            "title": "Bad Item",
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_items_grouped_by_stage(client):
    """GET /projects/{id}/items returns a dict keyed by all pipeline stage names."""
    proj_resp = await client.post("/api/v1/projects/", json={"name": "Grouping Test"})
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # Add two items in different stages
    for stage, item_type, title in [
        ("Idea", "brief", "The Idea"),
        ("Script", "script", "The Script"),
    ]:
        await client.post(
            f"/api/v1/projects/{project_id}/items",
            data={"stage": stage, "type": item_type, "title": title},
        )

    resp = await client.get(f"/api/v1/projects/{project_id}/items")
    assert resp.status_code == 200
    data = resp.json()

    # All 7 stage keys must be present
    from app.constants import PIPELINE_STAGES
    for stage in PIPELINE_STAGES:
        assert stage in data, f"Stage '{stage}' missing from response"

    assert len(data["Idea"]) == 1
    assert len(data["Script"]) == 1
    assert data["Idea"][0]["title"] == "The Idea"
