"""Deterministic NLE timeline metadata analysis."""
from __future__ import annotations

from typing import Any

from app.agents.base_agent import AgentBase, AnalysisResult, Recommendation
from app.models.item import Item

EDIT_MODEL_ID = "storyops/rules-edit-v1"


class EditAgent(AgentBase):
    """Analyze scene timing for pacing and retention risks."""

    requires_watsonx = False

    async def analyze(self, item: Item) -> AnalysisResult:
        scenes = item.item_metadata.get("scenes")
        if not isinstance(scenes, list) or not scenes:
            recommendation = Recommendation(
                title="Add timeline metadata",
                detail=(
                    "Import scene timing as item.metadata.scenes using "
                    "{start_ms, end_ms, type} objects."
                ),
                priority="medium",
            )
            return AnalysisResult(
                agent_type="edit",
                summary="No scene timeline metadata is available for pacing analysis.",
                recommendations=[recommendation],
                score_metrics={"scene_count": 0},
                model_id=EDIT_MODEL_ID,
                tasks_to_create=[
                    {
                        "title": recommendation.title,
                        "description": recommendation.detail,
                        "priority": recommendation.priority,
                    }
                ],
            )

        durations = [_scene_duration(scene, index) for index, scene in enumerate(scenes)]
        average_seconds = sum(durations) / len(durations) / 1000
        longest_seconds = max(durations) / 1000
        recommendations: list[Recommendation] = []

        if longest_seconds > 8:
            recommendations.append(
                Recommendation(
                    title="Shorten the longest scene",
                    detail=(
                        f"The longest scene runs {longest_seconds:.1f}s. Consider a "
                        "visual change or tighter cut before eight seconds."
                    ),
                    priority="high",
                )
            )
        if average_seconds > 5:
            recommendations.append(
                Recommendation(
                    title="Increase pacing variety",
                    detail=(
                        f"Average scene duration is {average_seconds:.1f}s. Mix shorter "
                        "beats into explanatory sections to reset attention."
                    ),
                    priority="medium",
                )
            )
        if len(scenes) < 3:
            recommendations.append(
                Recommendation(
                    title="Add visual progression",
                    detail="Use at least three distinct visual beats to support the narrative arc.",
                    priority="low",
                )
            )

        return AnalysisResult(
            agent_type="edit",
            summary=(
                f"Analyzed {len(scenes)} scenes with an average duration of "
                f"{average_seconds:.1f}s and a longest scene of {longest_seconds:.1f}s."
            ),
            recommendations=recommendations,
            score_metrics={
                "scene_count": len(scenes),
                "average_scene_seconds": round(average_seconds, 1),
                "longest_scene_seconds": round(longest_seconds, 1),
            },
            model_id=EDIT_MODEL_ID,
            tasks_to_create=[
                {
                    "title": recommendation.title,
                    "description": recommendation.detail,
                    "priority": recommendation.priority,
                }
                for recommendation in recommendations
                if recommendation.priority in {"medium", "high"}
            ],
        )


def _scene_duration(scene: Any, index: int) -> float:
    if not isinstance(scene, dict):
        raise ValueError(f"Scene {index + 1} must be an object")
    start = scene.get("start_ms")
    end = scene.get("end_ms")
    if (
        isinstance(start, bool)
        or isinstance(end, bool)
        or not isinstance(start, (int, float))
        or not isinstance(end, (int, float))
        or start < 0
        or end <= start
    ):
        raise ValueError(
            f"Scene {index + 1} requires valid start_ms and end_ms values"
        )
    return float(end - start)
