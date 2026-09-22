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
        model_name: str = "anthropic/claude-sonnet-5"
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
        model_name: str = "anthropic/claude-sonnet-5"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Upgrade deprecated models dynamically
        if model_name == "anthropic/claude-3.5-sonnet":
            model_name = "anthropic/claude-sonnet-5"

        # Return error message if no key is configured
        if (
            not self.api_key
            or self.api_key.startswith("sk-or-v1-mock")
            or self.api_key.startswith("sk-mock-openai")
        ):
            yield {"type": "content", "delta": "⚠️ No valid API key configured. Please add your OpenRouter or OpenAI API key in the Admin Panel > API Settings."}
            yield {"type": "done", "total_tokens": 0}
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
                    error_body = await response.aread()
                    print(f"[OpenRouter Error] Status: {response.status_code}, Body: {error_body.decode('utf-8')}")
                    # Return error on upstream API failure
                    yield {"type": "content", "delta": f"⚠️ API Error (Status {response.status_code}). Please check your API key and billing on the provider's dashboard."}
                    yield {"type": "done", "total_tokens": 0}
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
        model_name: str = "anthropic/claude-sonnet-5"
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

        # Check for calendar appointment tools if available in tools
        has_calendar_tool = tools and any(t.get("function", {}).get("name") in ("get_calendar_availability", "create_calendar_event") for t in tools)
        
        if has_calendar_tool:
            is_availability_query = any(k in user_lower for k in ["availability", "available slots", "open slots", "what times", "free slots", "calendar open", "what time", "schedule", "when are you free"])
            is_booking_intent = any(k in user_lower for k in ["book appointment", "schedule consultation", "schedule meeting", "book a call", "reserve a slot", "book for", "book an appointment", "book a slot"])

            # 1. Booking intent with contact email provided -> execute create_calendar_event
            if (is_booking_intent or "book" in user_lower) and ("@" in user_message):
                name = "Prospective Customer"
                if "name is" in user_lower:
                    try:
                        name = user_message.split("name is", 1)[1].split(",")[0].split(".")[0].strip()
                    except Exception:
                        name = "Prospective Customer"
                elif "for " in user_lower:
                    try:
                        name = user_message.split("for ", 1)[1].split(" at ")[0].split(" on ")[0].strip()
                    except Exception:
                        name = "Prospective Customer"
                
                email = "customer@example.com"
                for token in user_message.split():
                    if "@" in token and "." in token:
                        email = token.strip(" ,.;:()")
                        break

                yield {
                    "type": "tool_call",
                    "tool_name": "create_calendar_event",
                    "arguments": {
                        "attendee_name": name,
                        "attendee_email": email,
                        "start_time": "2026-09-20T14:00:00Z",
                        "duration_minutes": 30,
                        "summary": f"Consultation with {name}",
                        "notes": f"Booked via chat: {user_message}"
                    }
                }
                msg = f"Your appointment has been confirmed and scheduled on Google Calendar for {name}! A calendar invite has been sent to {email}."
                for word in msg.split(" "):
                    yield {"type": "content", "delta": word + " "}
                    await asyncio.sleep(0.01)
                yield {"type": "done", "total_tokens": 90}
                return

            # 2. Availability query or date check -> execute get_calendar_availability
            if is_availability_query and not ("@" in user_message):
                yield {
                    "type": "tool_call",
                    "tool_name": "get_calendar_availability",
                    "arguments": {
                        "target_date": "2026-09-20",
                        "duration_minutes": 30
                    }
                }
                msg = "I've checked our live Google Calendar. We have slots available on 2026-09-20 at 10:00 AM, 11:30 AM, 2:00 PM, and 3:30 PM UTC. Which time works best for you? Please provide your name and email to confirm."
                for word in msg.split(" "):
                    yield {"type": "content", "delta": word + " "}
                    await asyncio.sleep(0.01)
                yield {"type": "done", "total_tokens": 75}
                return

            # 3. Booking intent without contact email or specific date -> ask user for booking details
            if is_booking_intent:
                msg = "I'd be glad to help you book an appointment! Could you please share your preferred date and time, as well as your name and email address?"
                for word in msg.split(" "):
                    yield {"type": "content", "delta": word + " "}
                    await asyncio.sleep(0.01)
                yield {"type": "done", "total_tokens": 50}
                return

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
