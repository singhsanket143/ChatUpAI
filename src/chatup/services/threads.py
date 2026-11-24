from __future__ import annotations

import uuid

from fastapi import HTTPException
from psycopg_pool import ConnectionPool

from chatup.repositories import (
    ensure_thread,
    ensure_user,
    list_threads,
    thread_belongs_to_user,
    update_thread_title,
)


def get_threads_for_user(pool: ConnectionPool, user_id: str) -> list[dict]:
    return list_threads(pool, user_id)


def create_thread_for_user(pool: ConnectionPool, user_id: str, title: str) -> dict:
    ensure_user(pool, user_id)
    thread_id = f"{user_id}:{uuid.uuid4().hex[:8]}"
    return ensure_thread(pool, user_id, thread_id, title)


def assert_thread_belongs_to_user(pool: ConnectionPool, user_id: str, thread_id: str) -> None:
    if not thread_belongs_to_user(pool, user_id, thread_id):
        raise HTTPException(status_code=404, detail="Thread not found.")


def rename_thread(pool: ConnectionPool, user_id: str, thread_id: str, title: str) -> dict:
    if not thread_belongs_to_user(pool, user_id, thread_id):
        raise HTTPException(status_code=404, detail="Thread not found.")
    row = update_thread_title(pool, user_id, thread_id, title)
    if not row:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return row