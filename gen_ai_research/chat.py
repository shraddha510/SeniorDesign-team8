from __future__ import annotations
from typing import Any

class ChatMessage:
    def __init__(self, content: str) -> None:
        self.content = content

    def to_dict(self) -> dict[str, Any]:
        pass


class UserMessage(ChatMessage):
    def to_dict(self) -> dict[str, Any]:
        return {
            "role": "user",
            "content": self.content
        }
    
class AssistantMessage(ChatMessage):
    def to_dict(self) -> dict[str, Any]:
        return {
            "role": "assistant",
            "content": self.content
        }