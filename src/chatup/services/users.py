from __future__ import annotations

from psycopg_pool import ConnectionPool

from chatup.repositories import ensure_thread, ensure_user


def login_user(pool: ConnectionPool, user_id: str, display_name: str | None) -> dict:
    # create user if it doesn't exist
    user = ensure_user(pool, user_id, display_name)
    # for the user create a default thread name
    default_thread_id = f"{user['user_id']}:main"
    # create a default thread for the user
    ensure_thread(pool, user["user_id"], default_thread_id, "Main chat")
    return user