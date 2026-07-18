"""Deterministic extraction of actionable creative feedback."""
from __future__ import annotations

import re

from app.agents.base_agent import AgentBase, AnalysisResult, Recommendation
from app.models.item import Item

FEEDBACK_MODEL_ID = "storyops/rules-feedback-v1"
ACTION_TERMS = ("need", "missing", "fix", "improve", "weak", "issue", "lose")


class FeedbackAgent(AgentBase):
    """Convert review notes into concise follow-up recommendations."""

    requires_watsonx = False

    async def analyze(self, item: Item) -> AnalysisResult:
        if not item.content or not item.content.strip():
            raise ValueError("Feedback items require non-empty text content")

        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[.!?])\s+|\n+", item.content)
            if sentence.strip()
        ]
        actionable = [
            sentence
            for sentence in sentences
            if any(term in sentence.lower() for term in ACTION_TERMS)
        ][:5]
        recommendations = [
            Recommendation(
                title="Address reviewer feedback",
                detail=sentence,
                priority=(
                    "high"
                    if any(term in sentence.lower() for term in ("missing", "lose", "must"))
                    else "medium"
                ),
            )
            for sentence in actionable
        ]

        return AnalysisResult(
            agent_type="feedback",
            summary=(
                f"Reviewed {len(sentences)} feedback points and identified "
                f"{len(recommendations)} actionable follow-ups."
            ),
            recommendations=recommendations,
            score_metrics={
                "feedback_points": len(sentences),
                "actionable_points": len(recommendations),
            },
            model_id=FEEDBACK_MODEL_ID,
            tasks_to_create=[
                {
                    "title": recommendation.title,
                    "description": recommendation.detail,
                    "priority": recommendation.priority,
                }
                for recommendation in recommendations
            ],
        )
