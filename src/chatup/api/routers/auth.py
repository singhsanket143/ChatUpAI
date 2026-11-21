from __future__ import annotations

from fastapi import APIRouter

from chatup.schemas.api import LoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserResponse)
def login(body: LoginRequest) -> UserResponse:
    return UserResponse(
        user_id=body.user_id.strip(),
        display_name=body.display_name.strip(),
    )