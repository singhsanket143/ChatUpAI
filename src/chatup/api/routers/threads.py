from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from chatup.api.deps import PoolDep, UserIdDep
from chatup.schemas.api import ThreadCreate, ThreadResponse, ThreadUpdate
from chatup.services.threads import (
    create_thread_for_user,
    get_threads_for_user,
    rename_thread,
)

router = APIRouter(prefix="/api/threads", tags=["threads"])


def _timestamp(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)

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


@router.post("/", response_model=ThreadResponse)
def create_thread(
    body: ThreadCreate,
    pool: PoolDep,
    user_id: UserIdDep,
) -> ThreadResponse:
    row = create_thread_for_user(pool, user_id, body.title)
    return _to_response(row)


@router.patch("/{thread_id}", response_model=ThreadResponse)
@router.put("/{thread_id}", response_model=ThreadResponse)
def update_thread(
    thread_id: str,
    body: ThreadUpdate,
    pool: PoolDep,
    user_id: UserIdDep,
) -> ThreadResponse:
    row = rename_thread(pool, user_id, thread_id, body.title)
    return _to_response(row)