from __future__ import annotations

from psycopg_pool import ConnectionPool

from chatup.agents.runtime import AppRuntime
from chatup.services.threads import assert_thread_belongs_to_user


def chat_once(
    pool: ConnectionPool,
    runtime: AppRuntime,
    user_id: str,
    thread_id: str,
    message: str,
) -> tuple[str, str]:
    assert_thread_belongs_to_user(pool, user_id, thread_id)
    reply, _ = runtime.chat(user_id, thread_id, message)
    return reply, thread_id


def get_thread_messages(
    pool: ConnectionPool,
    runtime: AppRuntime,
    user_id: str,
    thread_id: str,
) -> list[dict[str, str]]:
    assert_thread_belongs_to_user(pool, user_id, thread_id)
    return runtime.get_chat_history(user_id, thread_id)