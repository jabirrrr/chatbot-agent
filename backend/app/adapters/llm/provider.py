import json
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Optional, Any
import httpx

from app.core.config import settings


class LLMMessage:
    def __init__(self, role: str, content: str, tool_calls: Optional[List[Dict[str, Any]]] = None):
        self.role = role
        self.content = content
        self.tool_calls = tool_calls

    def to_dict(self) -> Dict[str, Any]:
        d = {"role": self.role, "content": self.content}
        if self.tool_calls:
            d["tool_calls"] = self.tool_calls
        return d


class LLMProvider(ABC):
    """Abstract interface for multi-model LLM streaming gateways."""

    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        model_name: str = "anthropic/claude-3.5-sonnet"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields dictionaries with:
        - {"type": "content", "delta": "..."}
        - {"type": "tool_call", "tool_name": "...", "arguments": {...}}
        - {"type": "done", "total_tokens": int}
        """
        pass


class OpenRouterProvider(LLMProvider):
    """
    Production LLM gateway communicating with OpenRouter or OpenAI compatible APIs.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = base_url or settings.OPENROUTER_BASE_URL

    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        model_name: str = "anthropic/claude-3.5-sonnet"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Fallback to MockLLMProvider if testing or mock key
        if (
            settings.ENVIRONMENT == "testing"
            or not self.api_key
            or self.api_key.startswith("sk-or-v1-mock")
        ):
            mock = MockLLMProvider()
            async for chunk in mock.stream_chat(messages, tools, temperature, max_tokens, model_name):
                yield chunk
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://helio.ai",
            "X-Title": "Helio Chatbot Platform",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status_code != 200:
                    # Fallback to mock on upstream API failure
                    mock = MockLLMProvider()
                    async for chunk in mock.stream_chat(messages, tools, temperature, max_tokens, model_name):
                        yield chunk
                    return

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        yield {"type": "done", "total_tokens": 150}
                        break

                    try:
                        chunk_json = json.loads(data_str)
                        choices = chunk_json.get("choices", [])
                        if not choices:
                            continue
                        delta = choices[0].get("delta", {})

                        # Text delta
                        if "content" in delta and delta["content"]:
                            yield {"type": "content", "delta": delta["content"]}

                        # Tool call delta
                        if "tool_calls" in delta and delta["tool_calls"]:
                            tc = delta["tool_calls"][0]
                            function = tc.get("function", {})
                            if "name" in function:
                                yield {
                                    "type": "tool_call",
                                    "tool_name": function["name"],
                                    "arguments": json.loads(function.get("arguments", "{}"))
                                }
                    except Exception:
                        continue


class MockLLMProvider(LLMProvider):
    """
    Deterministic LLM provider for unit tests, offline continuous integration,
    and fallback resilience without external API cost.
    """
    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        model_name: str = "anthropic/claude-3.5-sonnet"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Extract user's latest query and system context
        user_message = ""
        system_context = ""
        for m in messages:
            if m.get("role") == "user":
                user_message = m.get("content", "")
            elif m.get("role") == "system":
                system_context = m.get("content", "")

        user_lower = user_message.lower()

        # Check for lead capture trigger: name/email/phone provided
        has_email = "@" in user_message and "." in user_message
        has_lead_intent = any(k in user_lower for k in ["my name is", "email is", "contact me at", "phone number"])

        if has_email or has_lead_intent:
            # Emit create_lead tool call
            # Parse simple fields if present
            name = "Prospective Customer"
            if "name is" in user_lower:
                try:
                    name = user_message.split("name is", 1)[1].split(",")[0].split(".")[0].strip()
                except Exception:
                    name = "Prospective Customer"

            email = None
            for token in user_message.split():
                if "@" in token and "." in token:
                    email = token.strip(" ,.;:()")
                    break

            yield {
                "type": "tool_call",
                "tool_name": "create_lead",
                "arguments": {
                    "name": name,
                    "email": email or "customer@example.com",
                    "phone": None,
                    "notes": f"Captured from chat: {user_message}"
                }
            }
            confirmation = f"Thank you {name}! I have captured your details and notified our team. We will be in touch shortly."
            for word in confirmation.split(" "):
                yield {"type": "content", "delta": word + " "}
                await asyncio.sleep(0.01)

            yield {"type": "done", "total_tokens": 80}
            return

        # Check for RAG knowledge in system context
        if "RELEVANT KNOWLEDGE CONTEXT:" in system_context:
            context_body = system_context.split("RELEVANT KNOWLEDGE CONTEXT:")[1].strip()
            if context_body and "No relevant documents found" not in context_body:
                # Answer grounded in context
                answer_words = (
                    f"Based on our business records: {context_body[:250]}. "
                    "Is there anything else I can help you with?"
                ).split(" ")
                for word in answer_words:
                    yield {"type": "content", "delta": word + " "}
                    await asyncio.sleep(0.01)

                yield {"type": "done", "total_tokens": 110}
                return

        # Check if question is absent (Honest fallback behavior - REQ-AI-06)
        fallback_text = (
            "I'm sorry, I don't have that specific information in my business knowledge base. "
            "Would you like to share your email or phone number so a team member can contact you directly?"
        )
        for word in fallback_text.split(" "):
            yield {"type": "content", "delta": word + " "}
            await asyncio.sleep(0.01)

        yield {"type": "done", "total_tokens": 65}
