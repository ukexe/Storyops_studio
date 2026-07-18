"""Unit and integration tests for StoryOps AI agents."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock

import pytest

from app.agents import asset_agent as asset_agent_module
from app.agents import dispatcher as dispatcher_module
from app.agents.asset_agent import ASSET_MODEL_ID, AssetAgent
from app.agents.base_agent import parse_json_response
from app.agents.brief_agent import BRIEF_MODEL_ID, BriefAgent
from app.agents.edit_agent import EDIT_MODEL_ID, EditAgent
from app.agents.feedback_agent import FEEDBACK_MODEL_ID, FeedbackAgent
from app.agents.performance_agent import PERFORMANCE_MODEL_ID, PerformanceAgent
from app.agents.script_agent import SCRIPT_MODEL_ID, ScriptAgent
from app.models.item import Item


def test_parse_json_response_accepts_clean_object():
    parsed = parse_json_response('{"clarity_score": 8, "missing_info": []}')

    assert parsed == {"clarity_score": 8, "missing_info": []}


def test_parse_json_response_extracts_markdown_wrapped_object():
    raw = """
    Here is the requested result:
    ```json
    {
      "summary": "Keep the {brand} token intact.",
      "recommendations": [{"title": "Tighten hook"}]
    }
    ```
    """

    parsed = parse_json_response(raw)

    assert parsed["summary"] == "Keep the {brand} token intact."
    assert parsed["recommendations"][0]["title"] == "Tighten hook"


def test_parse_json_response_rejects_malformed_output():
    with pytest.raises(ValueError, match="Could not parse"):
        parse_json_response("No structured result was returned.")


@pytest.mark.asyncio
async def test_brief_agent_parses_scores_and_creates_missing_info_tasks():
    client = AsyncMock()
    client.generate_text.return_value = """
    {
      "objectives": ["Explain practical AI adoption"],
      "constraints": ["Three-minute runtime"],
      "missing_info": ["Primary distribution channel", "Call to action"],
      "clarity_score": 7
    }
    """
    item = Item(
        project_id=uuid.uuid4(),
        stage="Script",
        type="brief",
        title="Video Brief",
        content="Explain how AI changes creative work for small teams.",
        item_metadata={},
    )

    result = await BriefAgent(client).analyze(item)

    assert result.agent_type == "brief"
    assert result.model_id == BRIEF_MODEL_ID
    assert result.score_metrics["clarity_score"] == 7
    assert len(result.recommendations) == 2
    assert len(result.tasks_to_create) == 2
    assert result.tasks_to_create[0] == {
        "title": "Add missing info: Primary distribution channel",
        "description": "Primary distribution channel",
        "priority": "medium",
    }
    client.generate_text.assert_awaited_once()


@pytest.mark.asyncio
async def test_script_agent_caps_tasks_and_maps_retention_priority():
    client = AsyncMock()
    client.generate_text.return_value = """
    {
      "hook_strength": 4,
      "pacing_notes": ["Opening setup is too long", "Middle section is varied"],
      "cta_present": false,
      "retention_risk": "high",
      "improvements": [
        {"title": "Lead with the outcome", "detail": "Open on the audience benefit."},
        {"title": "Trim setup", "detail": "Reach the first example sooner."},
        {"title": "Add a CTA", "detail": "End with one specific next action."},
        {"title": "Shorten recap", "detail": "Remove repeated context."}
      ]
    }
    """
    item = Item(
        project_id=uuid.uuid4(),
        stage="Script",
        type="script",
        title="Podcast Script",
        content="Welcome to the show. Today we will talk about creative AI.",
        item_metadata={"content_type": "podcast"},
    )

    result = await ScriptAgent(client).analyze(item)

    assert result.agent_type == "script"
    assert result.model_id == SCRIPT_MODEL_ID
    assert result.score_metrics == {
        "hook_strength": 4,
        "cta_present": False,
        "retention_risk": "high",
    }
    assert len(result.recommendations) == 4
    assert len(result.tasks_to_create) == 3
    assert all(task["priority"] == "high" for task in result.tasks_to_create)
    assert "podcast" in client.generate_text.await_args.args[1]


@pytest.mark.asyncio
async def test_asset_agent_creates_tasks_for_medium_and_high_issues(monkeypatch):
    fetch_image = AsyncMock(return_value=b"\xff\xd8\xffdemo-image")
    monkeypatch.setattr(asset_agent_module, "_fetch_image_bytes", fetch_image)
    client = AsyncMock()
    client.analyze_image.return_value = """
    {
      "brand_consistency": 6,
      "logo_integrity": "flag",
      "issues": [
        {
          "element": "Subtitle",
          "description": "Increase contrast slightly.",
          "severity": "low"
        },
        {
          "element": "Logo",
          "description": "Restore the approved logo proportions.",
          "severity": "high"
        },
        {
          "element": "Headline",
          "description": "Move the headline inside the safe area.",
          "severity": "medium"
        }
      ]
    }
    """
    item = Item(
        project_id=uuid.uuid4(),
        stage="Assets",
        type="asset",
        title="Thumbnail v1",
        file_url="https://storage.example.test/thumbnail.jpg",
        item_metadata={},
    )

    result = await AssetAgent(client).analyze(item)

    assert result.agent_type == "asset"
    assert result.model_id == ASSET_MODEL_ID
    assert result.score_metrics == {
        "brand_consistency": 6,
        "logo_integrity": "flag",
    }
    assert len(result.recommendations) == 3
    assert [task["priority"] for task in result.tasks_to_create] == [
        "high",
        "medium",
    ]
    fetch_image.assert_awaited_once_with(item.file_url)
    client.analyze_image.assert_awaited_once()
    assert client.analyze_image.await_args.args[1] == b"\xff\xd8\xffdemo-image"


@pytest.mark.asyncio
async def test_edit_agent_analyzes_scene_timing():
    item = Item(
        project_id=uuid.uuid4(),
        stage="Edit",
        type="edit",
        title="Rough Cut",
        item_metadata={
            "scenes": [
                {"start_ms": 0, "end_ms": 10000, "type": "talking_head"},
                {"start_ms": 10000, "end_ms": 14000, "type": "b_roll"},
            ]
        },
    )

    result = await EditAgent(AsyncMock()).analyze(item)

    assert result.model_id == EDIT_MODEL_ID
    assert result.score_metrics["scene_count"] == 2
    assert result.score_metrics["longest_scene_seconds"] == 10
    assert result.tasks_to_create[0]["priority"] == "high"


@pytest.mark.asyncio
async def test_performance_agent_emits_metric_recommendations():
    item = Item(
        project_id=uuid.uuid4(),
        stage="Analyze",
        type="metric",
        title="Launch Metrics",
        item_metadata={"views": 1000, "avg_retention_pct": 35, "ctr_pct": 2.4},
    )

    result = await PerformanceAgent(AsyncMock()).analyze(item)

    assert result.model_id == PERFORMANCE_MODEL_ID
    assert result.score_metrics["views"] == 1000
    assert len(result.recommendations) == 2
    assert all(task["priority"] == "high" for task in result.tasks_to_create)


@pytest.mark.asyncio
async def test_feedback_agent_extracts_actionable_notes():
    item = Item(
        project_id=uuid.uuid4(),
        stage="Feedback",
        type="feedback",
        title="Director Notes",
        content="The opening hook needs work. The CTA is missing. Color looks good.",
        item_metadata={},
    )

    result = await FeedbackAgent(AsyncMock()).analyze(item)

    assert result.model_id == FEEDBACK_MODEL_ID
    assert result.score_metrics["actionable_points"] == 2
    assert len(result.tasks_to_create) == 2


@pytest.mark.asyncio
async def test_analysis_endpoint_persists_analysis_and_tasks(
    client,
    other_client,
    monkeypatch,
):
    watsonx_client = AsyncMock()
    watsonx_client.generate_text.return_value = """
    {
      "objectives": ["Teach practical AI workflow improvements"],
      "constraints": ["Three-minute runtime"],
      "missing_info": ["Call to action"],
      "clarity_score": 8
    }
    """
    monkeypatch.setattr(dispatcher_module, "get_client", lambda: watsonx_client)

    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "Agent Integration"},
    )
    project_id = project_response.json()["id"]
    item_response = await client.post(
        f"/api/v1/projects/{project_id}/items",
        data={
            "stage": "Script",
            "type": "brief",
            "title": "Launch Brief",
            "content": "Explain practical creative AI workflows.",
        },
    )
    item_id = item_response.json()["id"]

    response = await client.post(f"/api/v1/items/{item_id}/analyze")

    assert response.status_code == 200
    assert response.json()["agent_type"] == "brief"
    assert response.json()["score_metrics"]["clarity_score"] == 8

    analyses_response = await client.get(f"/api/v1/items/{item_id}/analyses")
    assert analyses_response.status_code == 200
    assert len(analyses_response.json()) == 1

    tasks_response = await client.get(f"/api/v1/projects/{project_id}/tasks")
    assert tasks_response.status_code == 200
    assert len(tasks_response.json()) == 1
    assert tasks_response.json()[0]["linked_item_id"] == item_id

    cross_tenant_response = await other_client.get(
        f"/api/v1/items/{item_id}/analyses"
    )
    assert cross_tenant_response.status_code == 404


@pytest.mark.asyncio
async def test_rules_analysis_does_not_require_watsonx(client, monkeypatch):
    def fail_if_called():
        raise AssertionError("Rules agents must not initialize watsonx.ai")

    monkeypatch.setattr(dispatcher_module, "get_client", fail_if_called)
    project_response = await client.post(
        "/api/v1/projects/",
        json={"name": "Offline Rules Agent Test"},
    )
    project_id = project_response.json()["id"]
    item_response = await client.post(
        f"/api/v1/projects/{project_id}/items",
        data={
            "stage": "Edit",
            "type": "edit",
            "title": "Rough Cut",
            "metadata": '{"scenes": []}',
        },
    )
    item_id = item_response.json()["id"]

    response = await client.post(f"/api/v1/items/{item_id}/analyze")

    assert response.status_code == 200
    assert response.json()["model_id"] == EDIT_MODEL_ID
