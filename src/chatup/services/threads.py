from __future__ import annotations

from psycopg_pool import ConnectionPool

from chatup.repositories import list_threads


def get_threads_for_user(pool: ConnectionPool, user_id: str) -> list[dict]:
    return list_threads(pool, user_id)