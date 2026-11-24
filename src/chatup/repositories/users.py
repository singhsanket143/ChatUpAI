from __future__ import annotations

from psycopg_pool import ConnectionPool


def ensure_user(
    pool: ConnectionPool,
    user_id: str,
    display_name: str | None = None,
) -> dict:
    user_id = user_id.strip()
    if not user_id:
        raise ValueError("User id cannot be empty.")
    with pool.connection() as conn:
        conn.execute(
            """
            INSERT INTO chatup_users (user_id, display_name)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id, display_name or user_id),
        )
        row = conn.execute(
            """
            SELECT user_id, display_name, created_at
            FROM chatup_users
            WHERE user_id = %s
            """,
            (user_id,),
        ).fetchone()
    return row  # type: ignore[return-value]