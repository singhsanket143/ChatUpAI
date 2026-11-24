from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from psycopg_pool import ConnectionPool

from chatup.config import get_settings
from chatup.services.threads import assert_thread_belongs_to_user

_MEM: dict[tuple[str, str], list] = {}


def chat_once(
    pool: ConnectionPool,
    user_id: str,
    thread_id: str,
    message: str,
) -> tuple[str, str]:
    assert_thread_belongs_to_user(pool, user_id, thread_id)
    settings = get_settings()
    key = (user_id, thread_id) # to uniquely identify the conversation
    history = _MEM.setdefault(
        key,
        [SystemMessage(content="You are ChatUp, a helpful assistant.")],
    )
    history.append(HumanMessage(content=message))
    model = ChatOpenAI(model=settings.chat_model)
    reply = model.invoke(history).content
    if isinstance(reply, str):
        text = reply
    else:
        text = str(reply)
    history.append(AIMessage(content=text))
    return text, thread_id