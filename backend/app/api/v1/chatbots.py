import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotUpdate,
    ChatbotRead,
    PublicWidgetConfig,
    ChatbotPreviewRequest
)
from app.services.platform_integration_service import get_integration_by_provider
from app.core.vault import decrypt_vault_secret
from app.adapters.llm.provider import OpenRouterProvider
from app.services.chatbot_service import ChatbotService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/chatbots", tags=["Chatbots"])


@router.get(
    "/",
    response_model=List[ChatbotRead],
    summary="List organization chatbots"
)
async def list_chatbots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Returns all AI chatbot agents configured under the current tenant organization.
    """
    bots = await ChatbotService.list_for_org(db, org.id)
    return [ChatbotRead.model_validate(b) for b in bots]


@router.post(
    "/",
    response_model=ChatbotRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chatbot agent"
)
async def create_chatbot(
    data: ChatbotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Creates an AI chatbot agent with custom prompt instructions and generates its unique embed token.
    """
    bot = await ChatbotService.create(db, org.id, data)
    return ChatbotRead.model_validate(bot)


@router.get(
    "/{chatbot_id}",
    response_model=ChatbotRead,
    summary="Get chatbot configuration"
)
async def get_chatbot(
    chatbot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Retrieves complete configuration for a specific chatbot within the active organization.
    """
    bot = await ChatbotService.get_by_id(db, org.id, chatbot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Chatbot not found.")
    return ChatbotRead.model_validate(bot)


@router.put(
    "/{chatbot_id}",
    response_model=ChatbotRead,
    summary="Update chatbot prompt or settings"
)
async def update_chatbot(
    chatbot_id: uuid.UUID,
    data: ChatbotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Updates prompt instructions, AI model options, theme color, or active status switch.
    """
    bot = await ChatbotService.update(db, org.id, chatbot_id, data)
    return ChatbotRead.model_validate(bot)


@router.delete(
    "/{chatbot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a chatbot"
)
async def delete_chatbot(
    chatbot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Deletes the chatbot permanently.
    """
    await ChatbotService.delete(db, org.id, chatbot_id)
    return None


@router.post(
    "/{chatbot_id}/regenerate-token",
    response_model=ChatbotRead,
    summary="Regenerate widget embed token"
)
async def regenerate_token(
    chatbot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Invalidates the old embed token and generates a new token for the customer widget.
    """
    bot = await ChatbotService.regenerate_token(db, org.id, chatbot_id)
    return ChatbotRead.model_validate(bot)


@router.get(
    "/public/widget/{widget_token}",
    response_model=PublicWidgetConfig,
    summary="Public endpoint for widget initialization"
)
async def get_public_widget_config(
    widget_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Unauthenticated public endpoint called by the customer website widget to fetch appearance and welcome settings.
    """
    bot = await ChatbotService.get_by_widget_token(db, widget_token)
    if not bot:
        raise HTTPException(status_code=404, detail="Active chatbot not found for this widget token.")
    return PublicWidgetConfig.model_validate(bot)

@router.post(
    "/preview",
    summary="Stateless chatbot preview endpoint for the UI builder"
)
async def preview_chatbot(
    data: ChatbotPreviewRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Stateless endpoint that accepts test parameters and history,
    resolves the active LLM key from Admin Panel platform integrations,
    and returns a test response from the LLM.
    """
    integration = await get_integration_by_provider(db, "openrouter")
    
    # Check OpenAI if openrouter is not set
    if not integration or not integration.is_active:
        integration = await get_integration_by_provider(db, "openai")

    if not integration or not integration.is_active or not integration.encrypted_credentials:
        raise HTTPException(status_code=400, detail="No active OpenRouter or OpenAI integration found in Admin Panel.")

    try:
        api_key = decrypt_vault_secret(integration.encrypted_credentials)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt API key.")

    provider = OpenRouterProvider(api_key=api_key)
    if integration.provider == "openai":
        provider.base_url = "https://api.openai.com/v1"
        
    # Build System Prompt for the preview
    from datetime import datetime, timezone
    bot_name = data.botConfig.get("name", "Helio LeadBot") if data.botConfig else "Helio LeadBot"
    bot_tone = data.botConfig.get("tone", "Friendly") if data.botConfig else "Friendly"
    bot_desc = data.botConfig.get("businessDescription", "") if data.botConfig else ""
    current_time = datetime.now(timezone.utc).strftime("%A, %B %d, %Y at %I:%M %p UTC")
    
    system_prompt = f"You are {bot_name}, a customer support and sales AI assistant.\nTone: {bot_tone}.\nBusiness Context: {bot_desc}\nInstructions:\n- Be concise, helpful, and polite. Keep responses under 2-3 sentences unless more detail is specifically requested.\n- Focus on answering questions, capturing lead interest, and offering to schedule or assist further.\n- Do not mention you are an external model; speak as the official assistant of {bot_name}.\n\nSYSTEM CONTEXT:\nThe current date and time is {current_time}. When scheduling appointments, always use this current year and date as your reference point."

    messages_payload = [{"role": "system", "content": system_prompt}]
    for msg in data.history:
        messages_payload.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    messages_payload.append({"role": "user", "content": data.message})

    # Call LLM
    response_text = ""
    async for chunk in provider.stream_chat(messages=messages_payload):
        if chunk.get("type") == "content":
            response_text += chunk.get("delta", "")

    return {"reply": response_text.strip(), "live": True, "provider": integration.provider}
