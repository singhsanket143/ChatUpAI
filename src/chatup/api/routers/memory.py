from __future__ import annotations

from fastapi import APIRouter, Query

from chatup.schemas.api import MemoryListReponse

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/", response_model=MemoryListReponse)
def list_memory(
    user_id: str = Query(..., description="The user ID"),
) -> MemoryListReponse:
    return MemoryListReponse(
        semantic=[],
        episodes=[],
        profile=[],
        procedural=[],
    )