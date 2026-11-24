from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from chatup.api.deps import PoolDep, UserIdDep
from chatup.schemas.api import ThreadResponse
from chatup.services.threads import get_threads_for_user

router = APIRouter(prefix="/api/threads", tags=["threads"])


def _timestamp(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)

# todo: move it to a factory/adapter layer
def _to_response(row: dict) -> ThreadResponse:
    return ThreadResponse(
        thread_id=row["thread_id"],
        title=row["title"],
        created_at=_timestamp(row.get("created_at")),
        updated_at=_timestamp(row.get("updated_at")),
    )


@router.get("/", response_model=list[ThreadResponse])
def list_threads(pool: PoolDep, user_id: UserIdDep) -> list[ThreadResponse]:
    return [_to_response(row) for row in get_threads_for_user(pool, user_id)]