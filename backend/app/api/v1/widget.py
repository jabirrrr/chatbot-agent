import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation, Message
from app.schemas.chatbot import PublicWidgetConfig
from app.schemas.conversation import (
    ConversationSessionCreate,
    ConversationSessionResponse,
    ChatMessageRequest,
    MessageRead
)
from app.services.rag_service import RAGService

router = APIRouter(prefix="/widget", tags=["Public Chat Widget"])


@router.get(
    "/config",
    response_model=PublicWidgetConfig,
    summary="Get public widget appearance & settings"
)
async def get_widget_config(
    token: str = Query(..., description="Public widget token"),
    db: AsyncSession = Depends(get_db)
):
    """
    Called by the embed script when initializing on the customer's website.
    Returns appearance, position, and feature toggles without exposing system prompts.
    """
    try:
        chatbot_uuid = uuid.UUID(token)
        stmt = select(Chatbot).where(
            (Chatbot.widget_token == token) | (Chatbot.id == chatbot_uuid),
            Chatbot.is_active == True
        )
    except ValueError:
        stmt = select(Chatbot).where(Chatbot.widget_token == token, Chatbot.is_active == True)
        
    res = await db.execute(stmt)
    bot = res.scalar_one_or_none()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found or inactive for this widget token."
        )
    config_data = bot.config_json or {}
    return PublicWidgetConfig(
        name=bot.name,
        welcome_message=bot.welcome_message,
        theme_color=bot.theme_color,
        position=bot.position,
        lead_capture_enabled=bot.lead_capture_enabled,
        appointment_booking_enabled=bot.appointment_booking_enabled,
        is_active=bot.is_active,
        avatar_url=config_data.get("avatarUrl"),
        tone=config_data.get("tone")
    )


@router.post(
    "/session",
    response_model=ConversationSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start or restore a chat conversation session"
)
async def create_or_restore_session(
    data: ConversationSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Initializes a new visitor conversation session or recovers an existing thread.
    Returns an ephemeral session token for subsequent streaming calls.
    """
    try:
        chatbot_uuid = uuid.UUID(data.widget_token)
        stmt = select(Chatbot).where(
            (Chatbot.widget_token == data.widget_token) | (Chatbot.id == chatbot_uuid),
            Chatbot.is_active == True
        )
    except ValueError:
        stmt = select(Chatbot).where(Chatbot.widget_token == data.widget_token, Chatbot.is_active == True)
        
    res = await db.execute(stmt)
    bot = res.scalar_one_or_none()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active chatbot not found."
        )

    # Check for active existing conversation with this visitor_id
    conv_stmt = (
        select(Conversation)
        .where(
            Conversation.chatbot_id == bot.id,
            Conversation.visitor_id == data.visitor_id,
            Conversation.status == "active"
        )
        .order_by(Conversation.created_at.desc())
    )
    conv_res = await db.execute(conv_stmt)
    conversation = conv_res.scalars().first()

    if not conversation:
        # Create new conversation
        conversation = Conversation(
            organization_id=bot.organization_id,
            chatbot_id=bot.id,
            visitor_id=data.visitor_id,
            status="active"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # Load message history
    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    msg_res = await db.execute(msg_stmt)
    messages = list(msg_res.scalars().all())

    return ConversationSessionResponse(
        session_token=conversation.session_token,
        conversation_id=conversation.id,
        chatbot_name=bot.name,
        welcome_message=bot.welcome_message,
        theme_color=bot.theme_color,
        messages=[MessageRead.model_validate(m) for m in messages]
    )


@router.post(
    "/message",
    summary="Stream conversational AI response via Server-Sent Events (SSE)"
)
async def send_chat_message(
    data: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives user message and returns a real-time text stream over HTTP Server-Sent Events (SSE).
    Retrieves grounded business knowledge and executes lead capture functions dynamically.
    """
    # Look up conversation by session token
    stmt = select(Conversation).where(Conversation.session_token == data.session_token)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Invalid or expired conversation session.")

    # Validate chatbot ownership if chatbot_id was specified
    if data.chatbot_id and conv.chatbot_id != data.chatbot_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conversation does not belong to the requested chatbot."
        )

    # Fetch chatbot configuration
    bot_stmt = select(Chatbot).where(Chatbot.id == conv.chatbot_id)
    bot_res = await db.execute(bot_stmt)
    bot = bot_res.scalar_one_or_none()
    if not bot or not bot.is_active:
        raise HTTPException(status_code=403, detail="This chatbot is currently offline.")

    async def event_generator():
        async for event in RAGService.handle_message_stream(
            db=db,
            conversation=conv,
            chatbot=bot,
            user_message=data.message
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
