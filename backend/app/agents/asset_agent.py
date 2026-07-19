"""Granite Vision-powered creative asset analysis."""
from __future__ import annotations

import asyncio
from typing import Any, cast

import httpx

from app.agents.base_agent import (
    AgentBase,
    AnalysisResult,
    Priority,
    Recommendation,
    parse_json_response,
)
from app.models.item import Item
from app.storage import (
    download_asset,
    is_asset_path,
    is_asset_path_for_project,
    is_public_asset_url,
)

ASSET_MODEL_ID = "ibm/granite-vision-3-2-2b"
MAX_IMAGE_BYTES = 10 * 1024 * 1024


class AssetAgent(AgentBase):
    """Audit image assets for brand consistency and logo integrity."""

    async def analyze(self, item: Item) -> AnalysisResult:
        if not item.file_url:
            raise ValueError("Asset items require a file_url")
        if is_asset_path(item.file_url) and not is_asset_path_for_project(
            item.file_url,
            item.project_id,
        ):
            raise ValueError("Asset path does not belong to the item project")

        image_bytes = await _fetch_image_bytes(item.file_url)
        prompt = """
You are a brand consistency auditor for StoryOps Studio. Analyze the provided
creative thumbnail or key visual. Focus on composition, legibility, visual
hierarchy, brand consistency, and whether any visible logo appears distorted,
obscured, or inconsistent.

Respond with a JSON object only — no explanation and no markdown — using
exactly this shape:
{
  "brand_consistency": 0,
  "logo_integrity": "pass",
  "issues": [
    {
      "element": "string",
      "description": "string",
      "severity": "low"
    }
  ]
}

brand_consistency must be from 0 to 10. logo_integrity must be "pass", "flag",
or "fail". severity must be "low", "medium", or "high".
""".strip()

        raw = await self.client.analyze_image(
            ASSET_MODEL_ID,
            image_bytes,
            prompt,
        )
        parsed = parse_json_response(raw)

        brand_consistency = _score(parsed, "brand_consistency")
        logo_integrity = parsed.get("logo_integrity")
        if logo_integrity not in {"pass", "flag", "fail"}:
            raise ValueError(
                "Asset Agent response field 'logo_integrity' must be pass, flag, or fail"
            )

        issues = _issues(parsed)
        recommendations = [
            Recommendation(
                title=f"Review {issue['element']}",
                detail=issue["description"],
                priority=cast(Priority, issue["severity"]),
            )
            for issue in issues
        ]
        tasks = [
            {
                "title": f"Fix asset issue: {issue['element']}",
                "description": issue["description"],
                "priority": issue["severity"],
            }
            for issue in issues
            if issue["severity"] in {"medium", "high"}
        ]

        summary = (
            f"Asset brand consistency is {brand_consistency:g}/10 and logo "
            f"integrity is {logo_integrity}. "
            f"{len(issues)} visual {'issue was' if len(issues) == 1 else 'issues were'} "
            "identified."
        )

        return AnalysisResult(
            agent_type="asset",
            summary=summary,
            recommendations=recommendations,
            score_metrics={
                "brand_consistency": brand_consistency,
                "logo_integrity": logo_integrity,
            },
            model_id=ASSET_MODEL_ID,
            tasks_to_create=tasks,
        )


async def _fetch_image_bytes(url: str) -> bytes:
    """Fetch a bounded image from trusted Supabase Storage."""
    if is_asset_path(url):
        image_bytes = await asyncio.to_thread(download_asset, url)
        if not image_bytes:
            raise ValueError("Downloaded asset image is empty")
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Asset image exceeds the 10 MB analysis limit")
        return image_bytes
    if not is_public_asset_url(url):
        raise ValueError("Asset URL is outside the configured Supabase Storage bucket")
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=False) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ValueError("Unable to download the asset image") from exc

    image_bytes = response.content
    if not image_bytes:
        raise ValueError("Downloaded asset image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Asset image exceeds the 10 MB analysis limit")
    return image_bytes


def _score(payload: dict[str, Any], key: str) -> float:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Asset Agent response field '{key}' must be numeric")
    if not 0 <= value <= 10:
        raise ValueError(f"Asset Agent response field '{key}' must be between 0 and 10")
    return float(value)


def _issues(payload: dict[str, Any]) -> list[dict[str, str]]:
    value = payload.get("issues")
    if not isinstance(value, list):
        raise ValueError("Asset Agent response field 'issues' must be an array")

    issues: list[dict[str, str]] = []
    for issue in value:
        if not isinstance(issue, dict):
            raise ValueError("Every asset issue must be an object")
        element = issue.get("element")
        description = issue.get("description")
        severity = issue.get("severity")
        if not isinstance(element, str) or not element.strip():
            raise ValueError("Every asset issue requires a non-empty element")
        if not isinstance(description, str) or not description.strip():
            raise ValueError("Every asset issue requires a non-empty description")
        if severity not in {"low", "medium", "high"}:
            raise ValueError("Every asset issue severity must be low, medium, or high")
        issues.append(
            {
                "element": element.strip(),
                "description": description.strip(),
                "severity": severity,
            }
        )
    return issues
