"""Granite-powered creative brief analysis."""
from __future__ import annotations

from typing import Any

from app.agents.base_agent import (
    AgentBase,
    AnalysisResult,
    Recommendation,
    parse_json_response,
)
from app.models.item import Item

BRIEF_MODEL_ID = "ibm/granite-3-8b-instruct"

SYSTEM_PROMPT = (
    "You are an expert creative operations analyst for StoryOps Studio. "
    "Analyze the following creative brief and respond with a JSON object only "
    "— no explanation and no markdown."
)


class BriefAgent(AgentBase):
    """Extract objectives, constraints, gaps, and clarity from a brief."""

    async def analyze(self, item: Item) -> AnalysisResult:
        if not item.content or not item.content.strip():
            raise ValueError("Brief items require non-empty text content")

        user_prompt = f"""
Analyze this creative brief:

<brief>
{item.content}
</brief>

Return exactly this JSON shape:
{{
  "objectives": ["string"],
  "constraints": ["string"],
  "missing_info": ["string"],
  "clarity_score": 0
}}

The clarity_score must be a number from 0 to 10. Keep every list item concise
and actionable.
""".strip()

        raw = await self.client.generate_text(
            BRIEF_MODEL_ID,
            SYSTEM_PROMPT,
            user_prompt,
        )
        parsed = parse_json_response(raw)

        objectives = _string_list(parsed, "objectives")
        constraints = _string_list(parsed, "constraints")
        missing_info = _string_list(parsed, "missing_info")
        clarity_score = _score(parsed, "clarity_score")

        recommendations = [
            Recommendation(
                title=f"Clarify: {missing}",
                detail=f"Add this missing information to the creative brief: {missing}",
                priority="medium",
            )
            for missing in missing_info
        ]
        tasks = [
            {
                "title": f"Add missing info: {missing}",
                "description": missing,
                "priority": "medium",
            }
            for missing in missing_info
        ]

        summary_parts = [
            f"Brief clarity is {clarity_score:g}/10.",
            (
                f"Objectives: {'; '.join(objectives)}."
                if objectives
                else "No clear objectives were identified."
            ),
        ]
        if constraints:
            summary_parts.append(f"Constraints: {'; '.join(constraints)}.")
        if missing_info:
            summary_parts.append(
                f"{len(missing_info)} missing information "
                f"{'item was' if len(missing_info) == 1 else 'items were'} identified."
            )

        return AnalysisResult(
            agent_type="brief",
            summary=" ".join(summary_parts),
            recommendations=recommendations,
            score_metrics={"clarity_score": clarity_score},
            model_id=BRIEF_MODEL_ID,
            tasks_to_create=tasks,
        )


def _string_list(payload: dict[str, Any], key: str) -> list[str]:
    value = payload.get(key)
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError(f"Brief Agent response field '{key}' must be a string array")
    return [item.strip() for item in value if item.strip()]


def _score(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Brief Agent response field '{key}' must be numeric")
    if not 0 <= value <= 10:
        raise ValueError(f"Brief Agent response field '{key}' must be between 0 and 10")
    return float(value)
