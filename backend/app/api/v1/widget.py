import json
import uuid
import urllib.parse
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
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


def parse_allowed_domains(raw_domain: Optional[Union[str, List[str]]]) -> List[str]:
    """
    Parses single-domain or multi-domain configurations into a normalized list of hostnames.
    Handles comma-separated, semicolon-separated, list of strings, protocols, and ports.
    """
    if not raw_domain:
        return []
    
    if isinstance(raw_domain, str):
        parts = [p.strip() for p in raw_domain.replace(";", ",").split(",") if p.strip()]
    elif isinstance(raw_domain, list):
        parts = [str(p).strip() for p in raw_domain if str(p).strip()]
    else:
        return []

    normalized = []
    for item in parts:
        item = item.lower()
        if item == "*":
            continue
        if "://" in item:
            parsed = urllib.parse.urlsplit(item)
            host = parsed.hostname or parsed.netloc
        else:
            host = item.split("/")[0].split(":")[0]
        if host and host not in normalized:
            normalized.append(host)
    return normalized


def verify_domain_authorization(bot: Chatbot, request: Request) -> None:
    """
    Validates that the incoming request is originating from an authorized domain if the chatbot
    has domain restrictions configured. Applied consistently across /config, /session, and /message.
    Does NOT treat Origin/Referer as authentication; serves strictly as an anti-hotlinking /
    domain restriction boundary.
    """
    config_data = bot.config_json or {}
    raw_domain = config_data.get("domain") or config_data.get("allowed_domains")
    allowed_domains = parse_allowed_domains(raw_domain)
    
    # If no restrictions configured, public embedding is allowed everywhere
    if not allowed_domains:
        return

    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    candidate_host = None
    if origin and origin.strip().lower() != "null":
        try:
            candidate_host = urllib.parse.urlsplit(origin.strip()).hostname
        except Exception:
            candidate_host = None

    if not candidate_host and referer and referer.strip().lower() != "null":
        try:
            candidate_host = urllib.parse.urlsplit(referer.strip()).hostname
        except Exception:
            candidate_host = None

    if not candidate_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Domain unauthorized: Missing or invalid Origin/Referer header for domain-restricted chatbot."
        )

    candidate_host = candidate_host.lower()

    # Verify if candidate_host matches any of the allowed domains (exact match or strict subdomain)
    is_authorized = False
    for allowed in allowed_domains:
        if candidate_host == allowed or candidate_host.endswith("." + allowed):
            is_authorized = True
            break

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Domain unauthorized: Host '{candidate_host}' is not in the authorized domains list for this chatbot."
        )


@router.get(
    "/config",
    response_model=PublicWidgetConfig,
    summary="Get public widget appearance & settings"
)
async def get_widget_config(
    request: Request,
    token: str = Query(..., description="Public widget token or chatbot ID"),
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

    # Server-side domain restriction enforcement
    verify_domain_authorization(bot, request)

    config_data = bot.config_json or {}
    return PublicWidgetConfig(
        name=bot.name,
        welcome_message=bot.welcome_message,
        theme_color=bot.theme_color,
        position=bot.position,
        lead_capture_enabled=bot.lead_capture_enabled,
        appointment_booking_enabled=bot.appointment_booking_enabled,
        is_active=bot.is_active,
        avatar_url=config_data.get("avatarUrl") or config_data.get("avatar_url"),
        tone=config_data.get("tone"),
        suggested_questions=config_data.get("suggestedQuestions") or config_data.get("suggested_questions") or [],
        bubble_style=config_data.get("bubbleStyle") or config_data.get("bubble_style") or "Modern"
    )


@router.post(
    "/session",
    response_model=ConversationSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start or restore a chat conversation session"
)
async def create_or_restore_session(
    request: Request,
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

    # Server-side domain restriction enforcement
    verify_domain_authorization(bot, request)

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
    request: Request,
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

    # Server-side domain restriction enforcement
    verify_domain_authorization(bot, request)

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
