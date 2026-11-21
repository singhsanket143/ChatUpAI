from __future__ import annotations

from fastapi import Header, HTTPException


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