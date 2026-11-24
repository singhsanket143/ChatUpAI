from __future__ import annotations

from psycopg_pool import ConnectionPool


def list_threads(pool: ConnectionPool, user_id: str) -> list[dict]:
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT thread_id, title, created_at, updated_at
            FROM chatup_threads
            WHERE user_id = %s
            ORDER BY updated_at DESC
            """,
            (user_id,),
        ).fetchall()
    return list(rows)

# create thread if it doesn't exist
def ensure_thread(
    pool: ConnectionPool,
    user_id: str,
    thread_id: str,
    title: str = "New Chat",
) -> dict:
    with pool.connection() as conn:
        conn.execute(
            """
            INSERT INTO chatup_threads (thread_id, user_id, title)
            VALUES (%s, %s, %s)
            ON CONFLICT (thread_id) DO NOTHING
            """,
            (thread_id, user_id, title),
        )
        row = conn.execute(
            """
            SELECT thread_id, title, created_at, updated_at
            FROM chatup_threads
            WHERE thread_id = %s
            """,
            (thread_id,),
        ).fetchone()
    return row  # type: ignore[return-value]


def update_thread_title(
    pool: ConnectionPool,
    user_id: str,
    thread_id: str,
    title: str,
) -> dict | None:
    title = title.strip()
    if not title:
        raise ValueError("Title cannot be empty.")
    with pool.connection() as conn:
        row = conn.execute(
            """
            UPDATE chatup_threads
            SET title = %s, updated_at = NOW()
            WHERE thread_id = %s AND user_id = %s
            RETURNING thread_id, title, created_at, updated_at
            """,
            (title, thread_id, user_id),
        ).fetchone()
    return row


def touch_thread(pool: ConnectionPool, thread_id: str) -> None:
    with pool.connection() as conn:
        conn.execute(
            "UPDATE chatup_threads SET updated_at = NOW() WHERE thread_id = %s",
            (thread_id,),
        )