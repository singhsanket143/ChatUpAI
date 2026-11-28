from __future__ import annotations

from langchain.agents import create_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph.state import CompiledStateGraph
from langgraph.store.postgres import PostgresStore
from langmem import create_manage_memory_tool, create_search_memory_tool


from chatup.config import Settings


def build_agent(
    settings: Settings, 
    store: PostgresStore,
    checkpointer: PostgresSaver) -> CompiledStateGraph:
    return create_agent(
        settings.chat_model,
        tools=[
            create_manage_memory_tool(("users", "{langgraph_user_id}", "semantic")),
            create_search_memory_tool(("users", "{langgraph_user_id}", "semantic")),
        ],
        store=store,
        checkpointer=checkpointer,
    ).with_config({"recursion_limit": 50})