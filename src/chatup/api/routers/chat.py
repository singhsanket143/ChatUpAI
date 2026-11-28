from __future__ import annotations

from fastapi import APIRouter, HTTPException

from chatup.api.deps import AppRuntimeDep, PoolDep, UserIdDep
from chatup.repositories import touch_thread
from chatup.schemas.api import ChatRequest, ChatResponse, MessageResponse
from chatup.services.chat import chat_once, get_thread_messages

router = APIRouter(prefix="/api/threads", tags=["chat"])


@router.get("/{thread_id}/messages", response_model=MessageResponse)
def list_thread_messages(
    thread_id: str,
    pool: PoolDep,
    runtime: AppRuntimeDep,
    user_id: UserIdDep,
) -> MessageResponse:
    messages = get_thread_messages(pool, runtime, user_id, thread_id)
    return MessageResponse(thread_id=thread_id, messages=messages)


@router.post("/{thread_id}/chat", response_model=ChatResponse)
def chat_in_thread(
    thread_id: str,
    body: ChatRequest,
    pool: PoolDep,
    runtime: AppRuntimeDep,
    user_id: UserIdDep,
) -> ChatResponse:
    try:
        reply, tid = chat_once(pool, runtime, user_id, thread_id, body.message)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    touch_thread(pool, thread_id)
    return ChatResponse(reply=reply, thread_id=tid)