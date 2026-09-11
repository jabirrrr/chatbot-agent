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
    PublicWidgetConfig
)
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
