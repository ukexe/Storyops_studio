from __future__ import annotations

import json
import uuid

import pytest

from app.agents.watsonx_client import WatsonxError
from app.models.task import Task


class _ModelClient:
    async def generate_text(self, *_args, **_kwargs) -> str:
        return json.dumps(
            {
                "response": (
                    "The workspace has one analyzed script and should resolve its "
                    "highest-priority recommendation before packaging reusable IP."
                ),
                "confidence": 0.82,
                "recommended_actions": [
                    "Review the current analysis evidence.",
                    "Resolve the highest-priority open task.",
                ],
                "artifact_content": (
                    "# Executive brief\n\nOne analyzed source is available."
                ),
            }
        )


class _UnavailableModelClient:
    async def generate_text(self, *_args, **_kwargs) -> str:
        raise WatsonxError("offline in test")


async def _project_with_script(client) -> tuple[str, str]:
    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "IP Foundry Control Plane"},
    )
    project_id = project_response.json()["id"]
    item_response = await client.post(
        f"/api/v1/projects/{project_id}/items",
        json={
            "stage": "Script",
            "type": "script",
            "title": "Reusable Launch Script",
            "content": "What if every team could reuse its best delivery patterns?",
            "metadata": {"content_type": "youtube"},
        },
    )
    return project_id, item_response.json()["id"]


@pytest.mark.asyncio
async def test_console_turn_persists_trace_messages_and_events(client, monkeypatch):
    project_id, _ = await _project_with_script(client)
    monkeypatch.setattr(
        "app.services.control_plane.get_client",
        lambda: _ModelClient(),
    )

    response = await client.post(
        f"/api/v1/projects/{project_id}/console/turns",
        json={
            "message": "Analyze my uploaded documents and recommend the next action.",
            "context": {"current_page": f"/projects/{project_id}"},
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["conversation"]["project_id"] == project_id
    assert payload["user_message"]["role"] == "user"
    assert payload["assistant_message"]["role"] == "assistant"
    assert payload["assistant_message"]["model_id"] == "ibm/granite-3-8b-instruct"
    assert payload["run"]["status"] == "completed"
    assert payload["run"]["progress"] == 100
    assert isinstance(payload["run"]["confidence"], float)
    assert [step["status"] for step in payload["steps"]] == [
        "completed",
        "completed",
    ]
    assert payload["artifacts"] == []

    conversation_id = payload["conversation"]["id"]
    messages_response = await client.get(
        f"/api/v1/conversations/{conversation_id}/messages"
    )
    assert [message["role"] for message in messages_response.json()] == [
        "user",
        "assistant",
    ]

    events_response = await client.get(
        f"/api/v1/projects/{project_id}/events",
    )
    event_types = [event["event_type"] for event in events_response.json()["events"]]
    assert "project.created" in event_types
    assert "item.created" in event_types
    assert "console.turn.started" in event_types
    assert "console.turn.completed" in event_types


@pytest.mark.asyncio
async def test_console_report_becomes_reusable_artifact(client, monkeypatch):
    project_id, _ = await _project_with_script(client)
    monkeypatch.setattr(
        "app.services.control_plane.get_client",
        lambda: _ModelClient(),
    )

    response = await client.post(
        f"/api/v1/projects/{project_id}/console/turns",
        json={"message": "Generate an executive impact report."},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["run"]["run_type"] == "executive_report"
    assert len(payload["steps"]) == 3
    assert payload["artifacts"][0]["type"] == "executive_report"
    assert payload["artifacts"][0]["source_message_id"] == payload[
        "assistant_message"
    ]["id"]

    artifacts_response = await client.get(
        f"/api/v1/projects/{project_id}/artifacts"
    )
    assert artifacts_response.status_code == 200
    assert artifacts_response.json()[0]["title"] == (
        "Executive workspace intelligence brief"
    )


@pytest.mark.asyncio
async def test_console_has_audited_fallback_and_event_cursor(client, monkeypatch):
    project_id, _ = await _project_with_script(client)
    monkeypatch.setattr(
        "app.services.control_plane.get_client",
        lambda: _UnavailableModelClient(),
    )

    response = await client.post(
        f"/api/v1/projects/{project_id}/console/turns",
        json={"message": "Why did confidence decrease?"},
    )

    assert response.status_code == 201
    assert response.json()["assistant_message"]["model_id"] == (
        "storyops/control-plane-rules-v1"
    )

    first_page = await client.get(
        f"/api/v1/projects/{project_id}/events",
        params={"limit": 1},
    )
    assert len(first_page.json()["events"]) == 1
    cursor = first_page.json()["next_cursor"]
    assert cursor

    second_page = await client.get(
        f"/api/v1/projects/{project_id}/events",
        params={"limit": 1, "cursor": cursor},
    )
    assert second_page.status_code == 200
    assert second_page.json()["events"][0]["id"] != first_page.json()["events"][0][
        "id"
    ]


@pytest.mark.asyncio
async def test_control_plane_enforces_project_ownership(
    client,
    other_client,
    monkeypatch,
):
    project_id, _ = await _project_with_script(client)
    monkeypatch.setattr(
        "app.services.control_plane.get_client",
        lambda: _ModelClient(),
    )

    response = await other_client.post(
        f"/api/v1/projects/{project_id}/console/turns",
        json={"message": "Analyze this workspace."},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_task_mutation_emits_reversible_timeline_event(client, db_session):
    project_id, item_id = await _project_with_script(client)
    task = Task(
        project_id=uuid.UUID(project_id),
        linked_item_id=uuid.UUID(item_id),
        title="Validate reusable pattern",
        status="todo",
        priority="high",
    )
    db_session.add(task)
    await db_session.commit()

    response = await client.patch(
        f"/api/v1/tasks/{task.id}",
        json={"status": "in_progress"},
    )

    assert response.status_code == 200
    events_response = await client.get(f"/api/v1/projects/{project_id}/events")
    task_event = next(
        event
        for event in events_response.json()["events"]
        if event["event_type"] == "task.updated"
    )
    assert task_event["is_reversible"] is True
    assert task_event["payload"]["before"]["status"] == "todo"
    assert task_event["payload"]["after"]["status"] == "in_progress"
