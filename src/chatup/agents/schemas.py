from __future__ import annotations
from typing import Optional

from pydantic import BaseModel, Field


class Episode(BaseModel):
    """Episode-based memory: a bounded record of a meaningful exchange or situation."""

    observation: str = Field(
        ...,
        description="A concise description of the episode or situation that occurred. It will define what happened. "
    )
    thoughts: str = Field(
        ...,
        description="Internal reasoning that led to a good outcome"
    )
    action: str = Field(
        ...,
        description="The action taken to address the situation. It will define what was done to resolve the situation. What the assistant did to resolve the situation."
    )
    result: str = Field(
        ...,
        description="The outcome of the action. It will define what was the result of the action and what to repeat next time."
    )


class UserProfile(BaseModel):
    """User profile memory: stable attributes and preferences inferred about the user."""
    name: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    occupation: Optional[str] = None
    interests: Optional[list[str]] = None
    goals: Optional[list[str]] = None
    preferences: Optional[list[str]] = None
    constraints: Optional[list[str]] = None
    communication_style: Optional[str] = None
    expertise_areas: Optional[list[str]] = None
    notes: Optional[str] = None


class SemanticFact(BaseModel):
    """Semantic fact memory: discrete factual knowledge extracted from conversations."""

    category: str 
    fact: str 
    context: str = ""


class ProceduralBehavior(BaseModel):
    """Procedural behavior memory: how the assistant should act or respond in recurring situations."""

    rules: str = Field(
        ...,
        descrription="Concise system-level behaviour rules learned from successful past interactions."
    )