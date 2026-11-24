from __future__ import annotations

from fastapi import APIRouter

from chatup.api.deps import PoolDep
from chatup.schemas.api import LoginRequest, UserResponse
from chatup.services.users import login_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserResponse)
def login(body: LoginRequest, pool: PoolDep) -> UserResponse:
    user = login_user(pool, body.user_id, body.display_name)
    return UserResponse(
        user_id=user["user_id"],
        display_name=user["display_name"],
    )