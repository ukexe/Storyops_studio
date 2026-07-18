from __future__ import annotations

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import UploadFile

from app.auth import get_current_user
from app.constants import PIPELINE_STAGES
from app.database import get_db
from app.models.analysis import Analysis
from app.models.item import Item
from app.models.project import Project
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.storage import delete_asset_url, detect_image_content_type, upload_asset

router = APIRouter(tags=["items"])
logger = logging.getLogger(__name__)

DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


async def _get_project_for_user(
    project_id: uuid.UUID, user_id: str, db: AsyncSession
) -> Project:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == uuid.UUID(user_id),
        )
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def _get_item_with_analysis(item_id: uuid.UUID, db: AsyncSession) -> Item:
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


async def _get_latest_analysis(item_id: uuid.UUID, db: AsyncSession) -> Analysis | None:
    analysis_result = await db.execute(
        select(Analysis)
        .where(Analysis.item_id == item_id)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .limit(1)
    )
    return analysis_result.scalar_one_or_none()


def _item_response(item: Item, latest: Analysis | None = None) -> ItemResponse:
    response = ItemResponse.model_validate(item)
    if latest:
        from app.schemas.analysis import AnalysisResponse

        response.latest_analysis = AnalysisResponse.model_validate(latest)
    return response


def _validation_error(exc: ValidationError) -> RequestValidationError:
    return RequestValidationError(exc.errors())


async def _parse_item_create_request(
    request: Request,
) -> tuple[ItemCreate, UploadFile | None]:
    content_type = request.headers.get("content-type", "").lower()

    if content_type.startswith("application/json"):
        try:
            payload = await request.json()
            if not isinstance(payload, dict):
                raise ValueError("JSON body must be an object")
            return ItemCreate.model_validate(payload), None
        except ValidationError as exc:
            raise _validation_error(exc) from exc
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc

    if content_type.startswith(("multipart/form-data", "application/x-www-form-urlencoded")):
        form = await request.form()
        metadata_raw = form.get("metadata")
        metadata: dict = {}
        if metadata_raw:
            if not isinstance(metadata_raw, str):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="metadata must be a JSON object string",
                )
            try:
                decoded_metadata = json.loads(metadata_raw)
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="metadata must be a valid JSON object string",
                ) from exc
            if not isinstance(decoded_metadata, dict):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="metadata must decode to a JSON object",
                )
            metadata = decoded_metadata

        file_value = form.get("file")
        if file_value is not None and not isinstance(file_value, UploadFile):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="file must be a multipart upload",
            )

        try:
            body = ItemCreate.model_validate(
                {
                    "stage": form.get("stage"),
                    "type": form.get("type"),
                    "title": form.get("title"),
                    "content": form.get("content"),
                    "metadata": metadata,
                }
            )
        except ValidationError as exc:
            raise _validation_error(exc) from exc
        return body, file_value

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Content-Type must be application/json or multipart/form-data",
    )


# ---------------------------------------------------------------------------
# GET /projects/{project_id}/items
# ---------------------------------------------------------------------------
@router.get("/projects/{project_id}/items", response_model=dict[str, list[ItemResponse]])
async def list_items(
    project_id: uuid.UUID, db: DB, user: CurrentUser
) -> dict[str, list[ItemResponse]]:
    """Return all items for a project grouped by stage."""
    await _get_project_for_user(project_id, user["user_id"], db)

    latest_analysis_id = (
        select(Analysis.id)
        .where(Analysis.item_id == Item.id)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .limit(1)
        .correlate(Item)
        .scalar_subquery()
    )
    result = await db.execute(
        select(Item, Analysis)
        .outerjoin(Analysis, Analysis.id == latest_analysis_id)
        .where(Item.project_id == project_id)
        .order_by(Item.created_at.asc())
    )

    grouped: dict[str, list[ItemResponse]] = {stage: [] for stage in PIPELINE_STAGES}
    for item, latest in result.all():
        grouped[item.stage].append(_item_response(item, latest))

    return grouped


# ---------------------------------------------------------------------------
# POST /projects/{project_id}/items
# ---------------------------------------------------------------------------
@router.post(
    "/projects/{project_id}/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["stage", "type", "title"],
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["stage", "type", "title"],
                        "properties": {
                            "stage": {"type": "string"},
                            "type": {"type": "string"},
                            "title": {"type": "string"},
                            "content": {"type": "string"},
                            "metadata": {"type": "string"},
                            "file": {"type": "string", "format": "binary"},
                        },
                    }
                },
            },
        }
    },
)
async def create_item(
    project_id: uuid.UUID,
    request: Request,
    db: DB,
    user: CurrentUser,
) -> ItemResponse:
    """Create an item from JSON or multipart form data."""
    await _get_project_for_user(project_id, user["user_id"], db)
    body, file = await _parse_item_create_request(request)

    if body.type == "asset" and file is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="asset items require an image file",
        )
    if body.type != "asset" and file is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="file uploads are only supported for asset items",
        )

    file_url: str | None = None
    if file is not None:
        file_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="asset file cannot be empty",
            )
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="file exceeds the 10 MB upload limit",
            )
        try:
            _, trusted_extension = detect_image_content_type(file_bytes)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="asset file must be a valid JPEG, PNG, GIF, or WebP image",
            ) from exc
        safe_stem = Path(file.filename or "asset").stem[:100] or "asset"
        filename = f"{uuid.uuid4()}-{safe_stem}{trusted_extension}"
        file_url = await asyncio.to_thread(
            upload_asset,
            str(project_id),
            filename,
            file_bytes,
        )

    item = Item(
        project_id=project_id,
        stage=body.stage,
        type=body.type,
        title=body.title,
        content=body.content,
        file_url=file_url,
        item_metadata=body.metadata,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _item_response(item)


# ---------------------------------------------------------------------------
# GET /items/{item_id}
# ---------------------------------------------------------------------------
@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: uuid.UUID, db: DB, user: CurrentUser) -> ItemResponse:
    """Return item detail with the latest analysis."""
    item = await _get_item_with_analysis(item_id, db)

    # Verify the caller owns the project this item belongs to
    await _get_project_for_user(item.project_id, user["user_id"], db)

    return _item_response(item, await _get_latest_analysis(item.id, db))


# ---------------------------------------------------------------------------
# PATCH /items/{item_id}
# ---------------------------------------------------------------------------
@router.patch("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: uuid.UUID, body: ItemUpdate, db: DB, user: CurrentUser
) -> ItemResponse:
    """Partial update of an item's stage, title, content, or metadata."""
    item = await _get_item_with_analysis(item_id, db)
    await _get_project_for_user(item.project_id, user["user_id"], db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # ItemUpdate uses `metadata` field name but ORM uses `item_metadata`
        orm_field = "item_metadata" if field == "metadata" else field
        setattr(item, orm_field, value)

    await db.commit()
    await db.refresh(item)
    return _item_response(item, await _get_latest_analysis(item.id, db))


# ---------------------------------------------------------------------------
# DELETE /items/{item_id}
# ---------------------------------------------------------------------------
@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_item(item_id: uuid.UUID, db: DB, user: CurrentUser) -> None:
    """Hard-delete an item and its analyses/tasks."""
    item = await _get_item_with_analysis(item_id, db)
    await _get_project_for_user(item.project_id, user["user_id"], db)
    file_url = item.file_url
    await db.delete(item)
    await db.commit()
    if file_url:
        try:
            await asyncio.to_thread(delete_asset_url, file_url)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to remove asset for deleted item %s", item_id)
