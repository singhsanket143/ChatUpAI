from __future__ import annotations

from fastapi import APIRouter, Query

from chatup.api.deps import UserIdDep
from chatup.schemas.api import MessageResponse

router = APIRouter(prefix="/api/threads", tags=["chat"])


@router.get("/{thread_id}/messages", response_model=MessageResponse)
def list_thread_messages(
    thread_id: str,
    _user_id: UserIdDep,
) -> MessageResponse:
    return MessageResponse(thread_id=thread_id, messages=[])