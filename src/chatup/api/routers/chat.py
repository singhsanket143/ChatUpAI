from __future__ import annotations

from fastapi import APIRouter, Query

from chatup.schemas.api import MessageResponse

router = APIRouter(prefix="/api/threads", tags=["chat"])


@router.get("/{thread_id}/messages", response_model=MessageResponse)
def list_thread_messages(
    thread_id: str,
    user_id: str = Query(..., description="The user ID"),
) -> MessageResponse:
    return MessageResponse(thread_id=thread_id, messages=[])