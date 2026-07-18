"""Granite-powered script structure and retention analysis."""
from __future__ import annotations

from typing import Any, cast

from app.agents.base_agent import (
    AgentBase,
    AnalysisResult,
    Priority,
    Recommendation,
    parse_json_response,
)
from app.models.item import Item

SCRIPT_MODEL_ID = "ibm/granite-3-8b-instruct"


class ScriptAgent(AgentBase):
    """Evaluate a script's hook, pacing, CTA, and retention risks."""

    async def analyze(self, item: Item) -> AnalysisResult:
        if not item.content or not item.content.strip():
            raise ValueError("Script items require non-empty text content")

        content_type = str(item.item_metadata.get("content_type", "youtube")).strip()
        if not content_type:
            content_type = "youtube"

        system_prompt = (
            "You are an expert StoryOps Studio script analyst specializing in "
            f"{content_type} content. Assess audience retention, pacing, narrative "
            "clarity, and conversion intent. Respond with a JSON object only — "
            "no explanation and no markdown."
        )
        user_prompt = f"""
Analyze this {content_type} script:

<script>
{item.content}
</script>

Return exactly this JSON shape:
{{
  "hook_strength": 0,
  "pacing_notes": ["string"],
  "cta_present": false,
  "retention_risk": "low",
  "improvements": [
    {{"title": "string", "detail": "string"}}
  ]
}}

hook_strength must be from 0 to 10. retention_risk must be "low", "medium",
or "high". Rank improvements from highest to lowest impact.
""".strip()

        raw = await self.client.generate_text(
            SCRIPT_MODEL_ID,
            system_prompt,
            user_prompt,
        )
        parsed = parse_json_response(raw)

        hook_strength = _score(parsed, "hook_strength")
        pacing_notes = _string_list(parsed, "pacing_notes")
        cta_present = parsed.get("cta_present")
        if not isinstance(cta_present, bool):
            raise ValueError("Script Agent response field 'cta_present' must be boolean")

        retention_risk = parsed.get("retention_risk")
        if retention_risk not in {"low", "medium", "high"}:
            raise ValueError(
                "Script Agent response field 'retention_risk' must be low, medium, or high"
            )
        priority = cast(Priority, retention_risk)

        improvements = _improvements(parsed)
        recommendations = [
            Recommendation(
                title=improvement["title"],
                detail=improvement["detail"],
                priority=priority,
            )
            for improvement in improvements
        ]
        tasks = [
            {
                "title": improvement["title"],
                "description": improvement["detail"],
                "priority": priority,
            }
            for improvement in improvements[:3]
        ]

        pacing_summary = (
            f" Pacing notes: {'; '.join(pacing_notes)}." if pacing_notes else ""
        )
        summary = (
            f"{content_type.title()} script hook strength is {hook_strength:g}/10; "
            f"retention risk is {retention_risk}. "
            f"{'A CTA is present.' if cta_present else 'No clear CTA was detected.'}"
            f"{pacing_summary}"
        )

        return AnalysisResult(
            agent_type="script",
            summary=summary,
            recommendations=recommendations,
            score_metrics={
                "hook_strength": hook_strength,
                "cta_present": cta_present,
                "retention_risk": retention_risk,
            },
            model_id=SCRIPT_MODEL_ID,
            tasks_to_create=tasks,
        )


def _string_list(payload: dict[str, Any], key: str) -> list[str]:
    value = payload.get(key)
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError(f"Script Agent response field '{key}' must be a string array")
    return [item.strip() for item in value if item.strip()]


def _score(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Script Agent response field '{key}' must be numeric")
    if not 0 <= value <= 10:
        raise ValueError(f"Script Agent response field '{key}' must be between 0 and 10")
    return float(value)


def _improvements(payload: dict[str, Any]) -> list[dict[str, str]]:
    value = payload.get("improvements")
    if not isinstance(value, list):
        raise ValueError("Script Agent response field 'improvements' must be an array")

    improvements: list[dict[str, str]] = []
    for improvement in value:
        if not isinstance(improvement, dict):
            raise ValueError("Every script improvement must be an object")
        title = improvement.get("title")
        detail = improvement.get("detail")
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Every script improvement requires a non-empty title")
        if not isinstance(detail, str) or not detail.strip():
            raise ValueError("Every script improvement requires non-empty detail")
        improvements.append({"title": title.strip(), "detail": detail.strip()})
    return improvements
