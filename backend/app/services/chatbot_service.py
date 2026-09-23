import uuid
import secrets
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.chatbot import Chatbot
from app.schemas.chatbot import ChatbotCreate, ChatbotUpdate


class ChatbotService:
    @staticmethod
    async def create(
        db: AsyncSession,
        org_id: uuid.UUID,
        data: ChatbotCreate
    ) -> Chatbot:
        """
        Creates a new AI Chatbot for the organization and generates its secure embed token.
        """
        widget_token = f"wgt_{secrets.token_urlsafe(32)}"
        chatbot = Chatbot(
            organization_id=org_id,
            name=data.name,
            description=data.description,
            system_prompt=data.system_prompt,
            welcome_message=data.welcome_message,
            fallback_message=data.fallback_message,
            model_name=data.model_name,
            temperature=data.temperature,
            theme_color=data.theme_color,
            position=data.position,
            lead_capture_enabled=data.lead_capture_enabled,
            appointment_booking_enabled=data.appointment_booking_enabled,
            config_json=data.config_json,
            widget_token=widget_token,
            is_active=True
        )
        db.add(chatbot)
        await db.commit()
        await db.refresh(chatbot)
        return chatbot

    @staticmethod
    async def list_for_org(
        db: AsyncSession,
        org_id: uuid.UUID
    ) -> List[Chatbot]:
        """Returns all chatbots belonging to the organization."""
        stmt = (
            select(Chatbot)
            .where(Chatbot.organization_id == org_id)
            .order_by(Chatbot.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        org_id: uuid.UUID,
        chatbot_id: uuid.UUID
    ) -> Optional[Chatbot]:
        """Retrieves a chatbot by ID within the organization's tenant boundary."""
        stmt = select(Chatbot).where(
            Chatbot.id == chatbot_id,
            Chatbot.organization_id == org_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_widget_token(
        db: AsyncSession,
        widget_token: str
    ) -> Optional[Chatbot]:
        """Retrieves active chatbot by public widget embed token."""
        stmt = select(Chatbot).where(
            Chatbot.widget_token == widget_token,
            Chatbot.is_active == True
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update(
        db: AsyncSession,
        org_id: uuid.UUID,
        chatbot_id: uuid.UUID,
        data: ChatbotUpdate
    ) -> Chatbot:
        """Updates chatbot parameters, prompt instructions, or active switch."""
        chatbot = await ChatbotService.get_by_id(db, org_id, chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found.")

        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(chatbot, field, value)

        await db.commit()
        await db.refresh(chatbot)
        return chatbot

    @staticmethod
    async def regenerate_token(
        db: AsyncSession,
        org_id: uuid.UUID,
        chatbot_id: uuid.UUID
    ) -> Chatbot:
        """Rotates the public widget token."""
        chatbot = await ChatbotService.get_by_id(db, org_id, chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found.")

        chatbot.widget_token = f"wgt_{secrets.token_urlsafe(32)}"
        await db.commit()
        await db.refresh(chatbot)
        return chatbot

    @staticmethod
    async def delete(
        db: AsyncSession,
        org_id: uuid.UUID,
        chatbot_id: uuid.UUID
    ) -> None:
        """Deletes a chatbot and cascades to its dependencies."""
        chatbot = await ChatbotService.get_by_id(db, org_id, chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found.")

        await db.delete(chatbot)
        await db.commit()

