"""Tests for project CRUD and ownership — T1.9."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_create_project(client):
    """POST /projects/ creates a project and returns it."""
    resp = await client.post(
        "/api/v1/projects/",
        json={"name": "My Hackathon Project", "description": "A test project"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Hackathon Project"
    assert data["description"] == "A test project"
    assert "id" in data
    assert "owner_id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_patch_project_wrong_user(client, other_client):
    """PATCH /projects/{id} with a different user returns 404."""
    # Create with primary user
    create_resp = await client.post("/api/v1/projects/", json={"name": "Owner's Project"})
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    # Try to update with other user
    patch_resp = await other_client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Hijacked Name"},
    )
    assert patch_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_project(client):
    """DELETE /projects/{id} removes the project; subsequent GET returns 404."""
    create_resp = await client.post("/api/v1/projects/", json={"name": "To Be Deleted"})
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/projects/{project_id}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/projects/{project_id}")
    assert get_resp.status_code == 404
