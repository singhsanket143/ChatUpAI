from __future__ import annotations

from psycopg_pool import ConnectionPool

from chatup.config import Settings


def create_pool(settings: Settings) -> ConnectionPool:
    return ConnectionPool(
        conninfo=settings.database_url,
        kwargs={"row_factory": settings.postgres_row_factory},
        min_size=settings.postgres_pool_min_size,
        max_size=settings.postgres_pool_max_size,
        open=settings.postgres_pool_open,
    )