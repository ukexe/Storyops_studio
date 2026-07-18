"""Single routing and persistence boundary for all StoryOps agents."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.asset_agent import AssetAgent
from app.agents.base_agent import AgentBase
from app.agents.brief_agent import BriefAgent
from app.agents.edit_agent import EditAgent
from app.agents.feedback_agent import FeedbackAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.script_agent import ScriptAgent
from app.agents.watsonx_client import get_client
from app.models.analysis import Analysis
from app.models.item import Item
from app.models.task import Task

AGENT_MAP: dict[str, type[AgentBase]] = {
    "brief": BriefAgent,
    "script": ScriptAgent,
    "asset": AssetAgent,
    "edit": EditAgent,
    "feedback": FeedbackAgent,
    "metric": PerformanceAgent,
}


async def dispatch(
    item: Item,
    db: AsyncSession,
    *,
    commit: bool = True,
) -> Analysis:
    """Run the matching agent and atomically persist its analysis and tasks."""
    agent_cls = AGENT_MAP.get(item.type)
    if agent_cls is None:
        raise ValueError(f"No agent is registered for item type: {item.type}")

    client = get_client() if agent_cls.requires_watsonx else None
    result = await agent_cls(client).analyze(item)

    analysis = Analysis(
        item_id=item.id,
        agent_type=result.agent_type,
        summary=result.summary,
        recommendations=[
            {
                "title": recommendation.title,
                "detail": recommendation.detail,
                "priority": recommendation.priority,
            }
            for recommendation in result.recommendations
        ],
        score_metrics=result.score_metrics,
        model_id=result.model_id,
    )

    try:
        db.add(analysis)
        for task_data in result.tasks_to_create:
            db.add(
                Task(
                    project_id=item.project_id,
                    linked_item_id=item.id,
                    title=task_data["title"],
                    description=task_data.get("description"),
                    priority=task_data.get("priority", "medium"),
                )
            )
        if commit:
            await db.commit()
        else:
            await db.flush()
        await db.refresh(analysis)
    except Exception:
        await db.rollback()
        raise

    return analysis
