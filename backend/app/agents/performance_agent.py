"""Deterministic post-publication performance analysis."""
from __future__ import annotations

from app.agents.base_agent import AgentBase, AnalysisResult, Recommendation
from app.models.item import Item

PERFORMANCE_MODEL_ID = "storyops/rules-performance-v1"


class PerformanceAgent(AgentBase):
    """Turn views, retention, and CTR metrics into actionable guidance."""

    requires_watsonx = False

    async def analyze(self, item: Item) -> AnalysisResult:
        views = _metric(item, "views", minimum=0)
        retention = _metric(item, "avg_retention_pct", minimum=0, maximum=100)
        ctr = _metric(item, "ctr_pct", minimum=0, maximum=100)
        recommendations: list[Recommendation] = []

        if retention < 40:
            recommendations.append(
                Recommendation(
                    title="Improve audience retention",
                    detail=(
                        f"Average retention is {retention:g}%. Revisit the opening "
                        "promise and remove low-value setup."
                    ),
                    priority="high",
                )
            )
        elif retention < 55:
            recommendations.append(
                Recommendation(
                    title="Strengthen mid-content pacing",
                    detail=(
                        f"Average retention is {retention:g}%. Add pattern interrupts "
                        "and bring proof points forward."
                    ),
                    priority="medium",
                )
            )

        if ctr < 3:
            recommendations.append(
                Recommendation(
                    title="Test a clearer thumbnail and title",
                    detail=(
                        f"Click-through rate is {ctr:g}%. Increase contrast and make "
                        "the audience outcome more specific."
                    ),
                    priority="high",
                )
            )
        elif ctr < 5:
            recommendations.append(
                Recommendation(
                    title="Refine packaging",
                    detail=(
                        f"Click-through rate is {ctr:g}%. Test a simpler visual "
                        "hierarchy and a more concrete title."
                    ),
                    priority="medium",
                )
            )

        return AnalysisResult(
            agent_type="performance",
            summary=(
                f"Content has {views:,.0f} views, {retention:g}% average retention, "
                f"and a {ctr:g}% click-through rate."
            ),
            recommendations=recommendations,
            score_metrics={
                "views": views,
                "avg_retention_pct": retention,
                "ctr_pct": ctr,
            },
            model_id=PERFORMANCE_MODEL_ID,
            tasks_to_create=[
                {
                    "title": recommendation.title,
                    "description": recommendation.detail,
                    "priority": recommendation.priority,
                }
                for recommendation in recommendations
            ],
        )


def _metric(
    item: Item,
    name: str,
    *,
    minimum: float,
    maximum: float | None = None,
) -> float:
    value = item.item_metadata.get(name)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Performance metric '{name}' must be numeric")
    numeric = float(value)
    if numeric < minimum or (maximum is not None and numeric > maximum):
        raise ValueError(f"Performance metric '{name}' is outside its valid range")
    return numeric
