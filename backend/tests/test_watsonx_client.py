"""Unit tests for the watsonx.ai SDK wrapper."""
from __future__ import annotations

import base64

import pytest

from app.agents import watsonx_client as watsonx_module
from app.agents.watsonx_client import WatsonxClient


class _FakeFoundationModels:
    def __init__(self) -> None:
        self.requested_limit: int | None = None

    def get_model_specs(self, *, limit: int) -> dict:
        self.requested_limit = limit
        return {"resources": [{"model_id": "ibm/granite-3-8b-instruct"}]}


class _FakeAPIClient:
    def __init__(self, **_kwargs) -> None:
        self.foundation_models = _FakeFoundationModels()


class _FakeModelInference:
    instances: list["_FakeModelInference"] = []

    def __init__(self, *, model_id: str, api_client: _FakeAPIClient) -> None:
        self.model_id = model_id
        self.api_client = api_client
        self.generate_call: dict | None = None
        self.chat_call: dict | None = None
        self.__class__.instances.append(self)

    def generate_text(self, **kwargs) -> str:
        self.generate_call = kwargs
        return '{"result": "ok"}'

    def chat(self, **kwargs) -> dict:
        self.chat_call = kwargs
        return {"choices": [{"message": {"content": '{"vision": "ok"}'}}]}


@pytest.fixture
def fake_sdk(monkeypatch):
    _FakeModelInference.instances.clear()
    monkeypatch.setattr(watsonx_module, "APIClient", _FakeAPIClient)
    monkeypatch.setattr(watsonx_module, "ModelInference", _FakeModelInference)


@pytest.mark.asyncio
async def test_generate_text_uses_model_inference_without_blocking(fake_sdk):
    client = WatsonxClient("api-key", "project-id", "https://example.test")

    result = await client.generate_text(
        "ibm/granite-3-8b-instruct",
        "Return JSON only.",
        "Analyze this brief.",
        max_tokens=256,
    )

    assert result == '{"result": "ok"}'
    model = _FakeModelInference.instances[0]
    assert "Return JSON only." in model.generate_call["prompt"]
    assert "Analyze this brief." in model.generate_call["prompt"]
    assert model.generate_call["params"]["max_new_tokens"] == 256


@pytest.mark.asyncio
async def test_analyze_image_sends_base64_data_url(fake_sdk):
    client = WatsonxClient("api-key", "project-id", "https://example.test")
    image_bytes = b"\x89PNG\r\n\x1a\nsample"

    result = await client.analyze_image(
        "ibm/granite-vision-3-2-2b",
        image_bytes,
        "Review brand consistency.",
    )

    assert result == '{"vision": "ok"}'
    model = _FakeModelInference.instances[0]
    image_part = model.chat_call["messages"][0]["content"][1]
    expected = base64.b64encode(image_bytes).decode("ascii")
    assert image_part["image_url"]["url"] == f"data:image/png;base64,{expected}"


@pytest.mark.asyncio
async def test_connection_check_updates_health_status(fake_sdk, client):
    watsonx_client = WatsonxClient(
        "api-key",
        "project-id",
        "https://example.test",
    )

    await watsonx_client.check_connection()

    assert watsonx_module.get_connection_status() == "connected"
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "unknown",
        "watsonx": "connected",
    }
