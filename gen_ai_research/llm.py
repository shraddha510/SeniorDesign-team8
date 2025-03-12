from __future__ import annotations
from enum import Enum
from chat import ChatMessage, UserMessage
import requests
from typing import Any
import json
from pydantic import BaseModel

class Model(str, Enum):
    MISTRAL_7B = "mistral"
    MISTRAL_NEMO = "mistral-nemo"
    MIXTRAL_7B = "mixtral:8x7b"
    MXBAI_LARGE = "mxbai-embed-large"
    LLAMA_3_2 = "llama3.2"


class OllamaClient:
    def __init__(
        self, model: Model, url: str = "http://localhost:11434"
    ) -> None:
        self._url = url
        self._model = model

    def chat(
        self,
        prompt: str,
        history: list[ChatMessage] | None = None,
        system_prompt: str | None = None,
        temperature: float = 0.1,
        top_p: float = 1.0,
        max_tokens: int | None = None,
        stop: list[str] | None = None,
    ) -> str:
        response = requests.post(
            url=f"{self._url}/v1/chat/completions",
            json={
                "model": self._model.value,
                "messages": self._format_chat_messages(
                    prompt=prompt, history=history, system_prompt=system_prompt
                ),
                "temperature": temperature,
                "top_p": top_p,
                "max_tokens": max_tokens,
                "stop": stop,
            },
        )
        if not response.ok:
            raise ValueError(f"(Status {response.status_code}) {response.text}")
        response_json = response.json()
        response_text: str = (
            response_json["choices"][0]["message"]["content"] or ""
        )
        return response_text

    def generate_json(
        self,
        prompt: str,
        schema: BaseModel,
        history: list[ChatMessage] | None = None,
        system_prompt: str | None = None,
        temperature: float = 0.1,
        top_p: float = 1.0,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        response = requests.post(
            url=f"{self._url}/v1/chat/completions",
            json={
                "model": self._model.value,
                "messages": self._format_chat_messages(
                    prompt=prompt, history=history, system_prompt=system_prompt
                ),
                "temperature": temperature,
                "top_p": top_p,
                "max_tokens": max_tokens,
                "tools": self._convert_schema_to_toolset(schema),
            },
        )
        if not response.ok:
            raise ValueError(f"(Status {response.status_code}) {response.text}")
        response_json = response.json()
        tool_calls: list[dict[str, Any]] = [
            tool_call["function"]
            for tool_call in response_json["choices"][0]["message"][
                "tool_calls"
            ]
        ]
        for tool_call in tool_calls:
            tool_call["arguments"] = json.loads(tool_call["arguments"])
        return tool_calls

    def embed(self, texts: list[str]) -> list[list[float]]:
        response = requests.post(
            url=f"{self._url}/v1/embeddings",
            json={
                "model": self._model.value,
                "input": texts,
                "encoding_format": "float",
            },
        )
        if not response.ok:
            raise ValueError(f"(Status {response.status_code}) {response.text}")
        response_json = response.json()
        return [embedding["embedding"] for embedding in response_json["data"]]

    def _format_chat_messages(
        self,
        prompt: str,
        history: list[ChatMessage] | None = None,
        system_prompt: str | None = None,
    ) -> list:
        messages: list[ChatMessage] = []
        new_message = UserMessage(content=prompt)
        if history is None or len(history) == 0:
            if system_prompt is not None:
                new_message.content = (
                    f"{system_prompt}\n\n{new_message.content}"
                )
        else:
            if not isinstance(history[0], UserMessage):
                raise ValueError(
                    "The first chat message should be a user message."
                )
            messages.extend(history)
        messages.append(new_message)
        return [message.to_dict() for message in messages]

    def _convert_schema_to_toolset(
        self, schema: BaseModel
    ) -> list[dict[str, Any]]:
        json_schema = schema.model_json_schema()
        return [
            {
                "type": "function",
                "function": {
                    "name": schema.__name__,
                    "parameters": {
                        "type": "object",
                        "properties": json_schema["properties"],
                        "required": json_schema["required"],
                        "additionalProperties": False,
                    },
                },
            }
        ]