"""Single routing and persistence boundary for all StoryOps agents."""
from __future__ import annotations

from sqlalchemy import select
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
MAX_TASKS_PER_ANALYSIS = 10
MAX_TASK_TITLE_LENGTH = 500
MAX_TASK_DESCRIPTION_LENGTH = 4000
MAX_RECOMMENDATIONS_PER_ANALYSIS = 20
MAX_ANALYSIS_SUMMARY_LENGTH = 10000


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
        summary=result.summary[:MAX_ANALYSIS_SUMMARY_LENGTH],
        recommendations=[
            {
                "title": recommendation.title[:MAX_TASK_TITLE_LENGTH],
                "detail": recommendation.detail[:MAX_TASK_DESCRIPTION_LENGTH],
                "priority": recommendation.priority,
            }
            for recommendation in result.recommendations[
                :MAX_RECOMMENDATIONS_PER_ANALYSIS
            ]
        ],
        score_metrics=result.score_metrics,
        model_id=result.model_id,
    )

    try:
        db.add(analysis)
        existing_titles = set(
            (
                await db.scalars(
                    select(Task.title).where(
                        Task.linked_item_id == item.id,
                        Task.status.in_(("todo", "in_progress")),
                    )
                )
            ).all()
        )
        for task_data in result.tasks_to_create[:MAX_TASKS_PER_ANALYSIS]:
            title = str(task_data["title"]).strip()[:MAX_TASK_TITLE_LENGTH]
            if not title or title in existing_titles:
                continue
            description_value = task_data.get("description")
            description = (
                str(description_value).strip()[:MAX_TASK_DESCRIPTION_LENGTH]
                if description_value is not None
                else None
            )
            db.add(
                Task(
                    project_id=item.project_id,
                    linked_item_id=item.id,
                    title=title,
                    description=description,
                    priority=task_data.get("priority", "medium"),
                )
            )
            existing_titles.add(title)
        if commit:
            await db.commit()
        else:
            await db.flush()
        await db.refresh(analysis)
    except Exception:
        await db.rollback()
        raise

    return analysis
