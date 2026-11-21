from pydantic import BaseModel, Field 
from typing import Literal


class LoginRequest(BaseModel):
    user_id: str = Field(..., description="The user ID")
    display_name: str = Field(..., description="The display name")


class UserResponse(BaseModel):
    user_id: str = Field(..., description="The user ID")
    display_name: str = Field(..., description="The display name")


class ThreadCreate(BaseModel):
    title: str = Field("New Thread", description="The title of the thread")

class ThreadUpdate(BaseModel):
    title: str = Field(..., description="The title of the thread")

class ThreadResponse(BaseModel):
    thread_id: str = Field(..., description="The thread ID")
    title: str = Field(..., description="The title of the thread")
    created_at: str | None = Field(None, description="The creation timestamp")
    updated_at: str | None = Field(None, description="The last update timestamp")


class MessageItem(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="The role of the message")
    content: str = Field(..., description="The content of the message")


class MessageResponse(BaseModel):
    thread_id: str = Field(..., description="The thread ID")
    messages: list[MessageItem]


class ChatRequest(BaseModel):
    message: str = Field(..., description="The message to send")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="The reply to the message")
    thread_id: str = Field(..., description="The thread ID")

class MemoryListReponse(BaseModel):
    semantic: list[dict] = Field(..., description="The semantic memory")
    episodes: list[dict] = Field(..., description="The episodes memory")
    profile: list[dict] = Field(..., description="The profile memory")
    procedural: list[dict] = Field(..., description="The procedural memory")

