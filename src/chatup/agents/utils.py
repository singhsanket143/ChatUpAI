from __future__ import annotations

from langchain_core.messages import AIMessage, BaseMessage


def _content(message: BaseMessage) -> str:
    content = message.content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
            elif isinstance(block, str):
                parts.append(block)
        return "\n".join(parts)
    return str(content)


def extract_assistant_reply(messages: list[BaseMessage]) -> str:
    """Last non-empty assistant text (skips tool-call-only turns)."""
    for message in reversed(messages):
        if not isinstance(message, AIMessage):
            continue
        text = _content(message).strip()
        if text:
            return text
    return ""