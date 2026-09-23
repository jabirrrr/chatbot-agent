import uuid
from typing import AsyncGenerator, Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.chatbot import Chatbot
from app.models.conversation import Conversation, Message
from app.models.lead import Lead
from app.models.knowledge import BusinessInfo
from app.services.knowledge_service import KnowledgeService
from app.services.calendar_tools import CALENDAR_TOOLS, CalendarToolsExecutor
from app.adapters.llm.provider import OpenRouterProvider, LLMProvider
from app.services.platform_integration_service import get_integration_by_provider
from app.core.vault import decrypt_vault_secret

LEAD_CAPTURE_TOOL = {
    "type": "function",
    "function": {
        "name": "create_lead",
        "description": "Captures prospective customer contact details (name, email, phone) to follow up on inquiries or sales.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Customer's full name"},
                "email": {"type": "string", "description": "Customer's email address"},
                "phone": {"type": "string", "description": "Customer's phone number"},
                "notes": {"type": "string", "description": "Summary of customer's interest or requirements"}
            },
            "required": ["name"]
        }
    }
}


class RAGService:
    """
    Orchestrates Retrieval-Augmented Generation (RAG):
    retrieves context chunks, formats system instructions, and streams responses.
    """

    @classmethod
    async def build_system_prompt(
        cls,
        db: AsyncSession,
        chatbot: Chatbot,
        query: str
    ) -> str:
        """
        Assembles dynamic system prompt with tenant business FAQs,
        semantic document chunks, and anti-hallucination guardrails.
        """
        from datetime import datetime, timezone
        prompt_parts: List[str] = []

        # 1. Base persona
        current_time = datetime.now(timezone.utc).strftime("%A, %B %d, %Y at %I:%M %p UTC")
        prompt_parts.append(
            f"ROLE & PERSONA:\n{chatbot.system_prompt}\n\n"
            f"SYSTEM CONTEXT:\n"
            f"The current date and time is {current_time}. When scheduling appointments, always use this current year and date as your reference point.\n"
            f"If a user wants to cancel or reschedule an appointment, DO NOT ask for an event ID. Instead, ask for their email address and use the `search_calendar_events` tool to find their upcoming appointments and retrieve the `event_id` automatically.\n"
            f"When you successfully book or reschedule an appointment, you MUST provide the Google Meet meeting link (returned as `meeting_link` or in the `event` data) to the user in your response."
        )

        # 2. Strict grounding instructions
        prompt_parts.append(
            "\nANTI-HALLUCINATION POLICY:\n"
            "Answer the user's question using ONLY the provided RELEVANT KNOWLEDGE CONTEXT and BUSINESS INFORMATION. "
            "If the information is not contained in the context, politely state: "
            f"'{chatbot.fallback_message}' and offer to connect them with a human team member. "
            "Do NOT invent facts, hours, prices, or policies."
        )

        # 3. Retrieve structured Business Information
        stmt = select(BusinessInfo).where(
            BusinessInfo.organization_id == chatbot.organization_id,
            BusinessInfo.is_active == True
        )
        res = await db.execute(stmt)
        biz_info = list(res.scalars().all())

        if biz_info:
            prompt_parts.append("\nBUSINESS INFORMATION:")
            for item in biz_info:
                if item.category == "faq" and item.question and item.answer:
                    prompt_parts.append(f"Q: {item.question}\nA: {item.answer}")
                elif item.content:
                    prompt_parts.append(f"[{item.category.upper()}]: {item.content}")

        # 4. Semantic Search across Document Chunks
        chunks = await KnowledgeService.semantic_search(
            db=db,
            org_id=chatbot.organization_id,
            query=query,
            top_k=4,
            chatbot_id=chatbot.id
        )

        prompt_parts.append("\nRELEVANT KNOWLEDGE CONTEXT:")
        if chunks:
            for idx, c in enumerate(chunks, 1):
                prompt_parts.append(f"[{idx}] {c['content']}")
        else:
            prompt_parts.append("No relevant documents found for this specific query.")

        return "\n\n".join(prompt_parts)

    @classmethod
    async def handle_message_stream(
        cls,
        db: AsyncSession,
        conversation: Conversation,
        chatbot: Chatbot,
        user_message: str,
        llm_provider: Optional[LLMProvider] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Processes a user message, executes RAG retrieval, runs LLM inference,
        handles lead capture tools, and yields SSE stream events.
        """
        if llm_provider is None:
            integration = await get_integration_by_provider(db, "openrouter")
            if not integration or not integration.is_active:
                integration = await get_integration_by_provider(db, "openai")
            
            api_key = None
            if integration and integration.is_active and integration.encrypted_credentials:
                try:
                    api_key = decrypt_vault_secret(integration.encrypted_credentials)
                except Exception as e:
                    print(f"Error decrypting integration key: {e}")
            
            llm_provider = OpenRouterProvider(api_key=api_key)
            if integration and integration.provider == "openai":
                llm_provider.base_url = "https://api.openai.com/v1"

        # 1. Save visitor message to database
        visitor_msg = Message(
            organization_id=chatbot.organization_id,
            conversation_id=conversation.id,
            sender_type="visitor",
            content=user_message
        )
        db.add(visitor_msg)
        await db.commit()

        # 2. Build dynamic system prompt
        system_prompt = await cls.build_system_prompt(db, chatbot, user_message)

        # 3. Fetch past conversation history (last 10 messages for session memory)
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        res = await db.execute(stmt)
        history = list(res.scalars().all())

        messages_payload: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]
        for m in history:
            role = "user" if m.sender_type == "visitor" else "assistant"
            messages_payload.append({"role": role, "content": m.content})

        tools: List[Dict[str, Any]] = []
        if chatbot.lead_capture_enabled:
            tools.append(LEAD_CAPTURE_TOOL)
        if chatbot.appointment_booking_enabled:
            tools.extend(CALENDAR_TOOLS)

        tools_payload = tools if tools else None

        # 4. Stream LLM chunks
        bot_response_text = ""
        captured_lead_data = None

        async for chunk in llm_provider.stream_chat(
            messages=messages_payload,
            tools=tools_payload,
            temperature=chatbot.temperature,
            max_tokens=int(chatbot.max_tokens),
            model_name=chatbot.model_name
        ):
            chunk_type = chunk.get("type")

            if chunk_type == "content":
                delta = chunk.get("delta", "")
                bot_response_text += delta
                yield {"event": "delta", "data": delta}

            elif chunk_type == "tool_call":
                tool_name = chunk.get("tool_name")
                args = chunk.get("arguments", {})

                if tool_name == "create_lead":
                    captured_lead_data = args
                    lead = Lead(
                        organization_id=chatbot.organization_id,
                        conversation_id=conversation.id,
                        chatbot_id=chatbot.id,
                        name=args.get("name", "Prospective Customer"),
                        email=args.get("email"),
                        phone=args.get("phone"),
                        notes=args.get("notes", "Captured via Chatbot Widget"),
                        status="new"
                    )
                    db.add(lead)
                    await db.commit()
                    yield {"event": "lead_captured", "data": {"name": lead.name, "email": lead.email}}

                elif tool_name in (
                    "get_calendar_availability",
                    "create_calendar_event",
                    "get_calendar_event",
                    "cancel_calendar_event",
                    "update_calendar_event"
                ):
                    action_result = await CalendarToolsExecutor.execute_tool(
                        tool_name=tool_name,
                        arguments=args,
                        db=db,
                        organization_id=chatbot.organization_id,
                        conversation_id=conversation.id
                    )
                    if tool_name == "create_calendar_event" and action_result.get("success"):
                        yield {"event": "appointment_booked", "data": action_result}
                    elif tool_name == "get_calendar_availability":
                        yield {"event": "calendar_availability", "data": action_result}
                    else:
                        yield {"event": "calendar_action", "data": action_result}

            elif chunk_type == "done":
                # 5. Persist bot reply in database
                bot_msg = Message(
                    organization_id=chatbot.organization_id,
                    conversation_id=conversation.id,
                    sender_type="bot",
                    content=bot_response_text,
                    tokens_used=chunk.get("total_tokens", 0)
                )
                db.add(bot_msg)
                await db.commit()
                yield {"event": "done", "data": {"message_id": str(bot_msg.id)}}
