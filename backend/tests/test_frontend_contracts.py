"""Integration tests for API contracts consumed by the Phase 3 frontend."""
from __future__ import annotations

import uuid

import pytest

from app.models.item import Item
from app.models.task import Task


@pytest.mark.asyncio
async def test_json_item_creation_metadata_and_project_counts(client):
    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "Frontend Contract"},
    )
    project_id = project_response.json()["id"]
    assert set(project_response.json()["item_counts"]) == {
        "Idea",
        "Script",
        "Assets",
        "Edit",
        "Feedback",
        "Publish",
        "Analyze",
    }
    assert sum(project_response.json()["item_counts"].values()) == 0

    item_response = await client.post(
        f"/api/v1/projects/{project_id}/items",
        json={
            "stage": "Script",
            "type": "script",
            "title": "Launch Script",
            "content": "A concise launch script.",
            "metadata": {"content_type": "youtube"},
        },
    )

    assert item_response.status_code == 201
    assert item_response.json()["metadata"] == {"content_type": "youtube"}
    assert "item_metadata" not in item_response.json()

    projects_response = await client.get("/api/v1/projects/")
    assert projects_response.status_code == 200
    project = next(
        project
        for project in projects_response.json()
        if project["id"] == project_id
    )
    assert project["item_counts"]["Script"] == 1
    assert set(project["item_counts"]) == {
        "Idea",
        "Script",
        "Assets",
        "Edit",
        "Feedback",
        "Publish",
        "Analyze",
    }


@pytest.mark.asyncio
async def test_asset_creation_requires_image_file(client):
    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "Asset Validation"},
    )
    project_id = project_response.json()["id"]

    response = await client.post(
        f"/api/v1/projects/{project_id}/items",
        data={
            "stage": "Assets",
            "type": "asset",
            "title": "Missing Thumbnail",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "asset items require an image file"


@pytest.mark.asyncio
async def test_task_status_query_uses_documented_alias(client, db_session):
    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "Task Filter"},
    )
    project_id = uuid.UUID(project_response.json()["id"])
    linked_item = Item(
        project_id=project_id,
        stage="Script",
        type="script",
        title="Launch Script",
        content="Script content",
        item_metadata={},
    )
    db_session.add(linked_item)
    await db_session.flush()
    linked_task = Task(
        project_id=project_id,
        linked_item_id=linked_item.id,
        title="Open task",
        status="todo",
    )
    db_session.add_all(
        [
            linked_task,
            Task(project_id=project_id, title="Finished task", status="done"),
        ]
    )
    await db_session.commit()

    response = await client.get(
        f"/api/v1/projects/{project_id}/tasks",
        params={"status": "todo"},
    )

    assert response.status_code == 200
    assert [task["title"] for task in response.json()] == ["Open task"]
    assert response.json()[0]["linked_item_title"] == "Launch Script"

    all_tasks_response = await client.get(f"/api/v1/projects/{project_id}/tasks")
    unlinked_task = next(
        task for task in all_tasks_response.json() if task["title"] == "Finished task"
    )
    assert unlinked_task["linked_item_title"] is None

    patch_response = await client.patch(
        f"/api/v1/tasks/{linked_task.id}",
        json={"status": "in_progress"},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["linked_item_title"] == "Launch Script"
