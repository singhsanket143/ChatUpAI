from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from psycopg_pool import ConnectionPool

from chatup.agents.runtime import AppRuntime, create_app_runtime
from chatup.config import get_settings
from chatup.repositories import create_pool


@lru_cache
def get_db_pool() -> ConnectionPool:
    return create_pool(get_settings())


@lru_cache
def get_app_runtime() -> AppRuntime:
    return create_app_runtime(get_settings())


def require_user_id(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
) -> str:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    user_id = x_user_id.strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    return user_id


def shutdown_runtime() -> None:
    return None


PoolDep = Annotated[ConnectionPool, Depends(get_db_pool)]
AppRuntimeDep = Annotated[AppRuntime, Depends(get_app_runtime)]
UserIdDep = Annotated[str, Depends(require_user_id)]