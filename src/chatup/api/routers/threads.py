from __future__ import annotations

from fastapi import APIRouter, Query

from chatup.schemas.api import ThreadResponse

router = APIRouter(prefix="/api/threads", tags=["threads"])


@router.get("/", response_model=list[ThreadResponse])
def list_threads(
    user_id: str = Query(..., description="The user ID"),
) -> list[ThreadResponse]:
    return []