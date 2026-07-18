"""Shared contracts and parsing utilities for StoryOps AI agents."""
from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, ClassVar, Literal

if TYPE_CHECKING:
    from app.models.item import Item

    from app.agents.watsonx_client import WatsonxClient

Priority = Literal["low", "medium", "high"]


@dataclass(frozen=True, slots=True)
class Recommendation:
    title: str
    detail: str
    priority: Priority


@dataclass(slots=True)
class AnalysisResult:
    agent_type: str
    summary: str
    recommendations: list[Recommendation]
    score_metrics: dict[str, Any]
    model_id: str
    tasks_to_create: list[dict[str, Any]]


class AgentBase(ABC):
    """Stateless analysis contract implemented by every item-type agent."""

    requires_watsonx: ClassVar[bool] = True

    def __init__(self, client: WatsonxClient | None) -> None:
        self._client = client

    @property
    def client(self) -> WatsonxClient:
        if self._client is None:
            raise RuntimeError(f"{type(self).__name__} requires a watsonx.ai client")
        return self._client

    @abstractmethod
    async def analyze(self, item: Item) -> AnalysisResult:
        """Analyze one persisted pipeline item."""


def parse_json_response(raw: str) -> dict[str, Any]:
    """Parse a JSON object, including one wrapped in model prose or markdown."""
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("Model response is empty")

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = None

    if isinstance(parsed, dict):
        return parsed
    if parsed is not None:
        raise ValueError("Model response must be a JSON object")

    # Granite can wrap otherwise valid JSON in a fenced block or a short preface.
    # raw_decode preserves nested objects and braces inside quoted strings, unlike
    # a regular-expression match from the first opening to the last closing brace.
    decoder = json.JSONDecoder()
    for index, character in enumerate(raw):
        if character != "{":
            continue
        try:
            candidate, _ = decoder.raw_decode(raw[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(candidate, dict):
            return candidate

    raise ValueError("Could not parse a JSON object from model response")
