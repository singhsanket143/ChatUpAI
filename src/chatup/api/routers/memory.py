from __future__ import annotations

from fastapi import APIRouter, Query

from chatup.api.deps import UserIdDep
from chatup.schemas.api import MemoryListReponse

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/", response_model=MemoryListReponse)
def list_memory(
    _user_id: UserIdDep,
) -> MemoryListReponse:
    return MemoryListReponse(
        semantic=[],
        episodes=[],
        profile=[],
        procedural=[],
    )