from __future__ import annotations

from langchain.agents import create_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph.state import CompiledStateGraph

from chatup.config import Settings


def build_agent(settings: Settings, checkpointer: PostgresSaver) -> CompiledStateGraph:
    return create_agent(
        settings.chat_model,
        tools=[],
        checkpointer=checkpointer,
    ).with_config({"recursion_limit": 50})