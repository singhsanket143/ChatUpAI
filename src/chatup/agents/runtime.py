from __future__ import annotations

from contextlib import AbstractContextManager
from dataclasses import dataclass, field
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph.state import CompiledStateGraph

from chatup.agents.build import build_agent
from chatup.agents.utils import extract_assistant_reply
from chatup.config import Settings


@dataclass
class AppRuntime:
    settings: Settings
    checkpointer: PostgresSaver
    agent: CompiledStateGraph
    _checkpointer_cm: AbstractContextManager[PostgresSaver] | None = field(
        default=None,
        repr=False,
    )

    def chat(self, user_id: str, thread_id: str, user_message: str) -> tuple[str, list[BaseMessage]]:
        config = self._chat_config(user_id, thread_id)
        self.agent.invoke(
            {"messages": [{"role": "user", "content": user_message}]},
            config=config,
        )
        snapshot = self.agent.get_state(config)
        messages = (snapshot.values or {}).get("messages") or []
        return extract_assistant_reply(messages), messages

    def _chat_config(self, user_id: str, thread_id: str) -> RunnableConfig:
        return {
            "configurable": {
                "thread_id": thread_id,
                "langgraph_user_id": user_id,
                "user_id": user_id,
            },
        }

    def close(self) -> None:
        if self._checkpointer_cm is not None:
            self._checkpointer_cm.__exit__(None, None, None)
            self._checkpointer_cm = None


def create_app_runtime(settings: Settings) -> AppRuntime:
    checkpointer_cm = PostgresSaver.from_conn_string(settings.database_url)
    checkpointer = checkpointer_cm.__enter__()
    checkpointer.setup()
    agent = build_agent(settings, checkpointer)
    return AppRuntime(
        settings=settings,
        checkpointer=checkpointer,
        agent=agent,
        _checkpointer_cm=checkpointer_cm,
    )