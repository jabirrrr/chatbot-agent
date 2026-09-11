import uuid
from typing import Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.onboarding import OnboardingChecklist
from app.models.chatbot import Chatbot
from app.models.knowledge import KnowledgeSource
from app.models.appointment import Appointment
from app.models.conversation import Conversation
from app.schemas.onboarding import OnboardingChecklistRead


class OnboardingService:
    @staticmethod
    async def get_or_create_checklist(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> OnboardingChecklist:
        stmt = select(OnboardingChecklist).where(OnboardingChecklist.organization_id == organization_id)
        checklist = (await db.execute(stmt)).scalar_one_or_none()
        if not checklist:
            checklist = OnboardingChecklist(
                organization_id=organization_id,
                account_created=True,
                chatbot_configured=False,
                knowledge_uploaded=False,
                appearance_customized=False,
                widget_installed=False,
                calendar_connected=False,
                first_test_chat=False
            )
            db.add(checklist)
            await db.commit()
            await db.refresh(checklist)
        return checklist

    @staticmethod
    async def update_step(
        db: AsyncSession,
        organization_id: uuid.UUID,
        step_key: str,
        completed: bool = True
    ) -> OnboardingChecklist:
        checklist = await OnboardingService.get_or_create_checklist(db, organization_id)
        if hasattr(checklist, step_key):
            setattr(checklist, step_key, completed)
            
            # Check if all 7 steps are complete
            steps = [
                checklist.account_created,
                checklist.chatbot_configured,
                checklist.knowledge_uploaded,
                checklist.appearance_customized,
                checklist.widget_installed,
                checklist.calendar_connected,
                checklist.first_test_chat,
            ]
            if all(steps) and not checklist.completed_at:
                checklist.completed_at = datetime.now(timezone.utc)
            elif not all(steps):
                checklist.completed_at = None

            await db.commit()
            await db.refresh(checklist)
        return checklist

    @staticmethod
    async def refresh_from_resources(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> OnboardingChecklist:
        """Inspects existing organizational resources and updates checklist states automatically."""
        checklist = await OnboardingService.get_or_create_checklist(db, organization_id)

        # 1. Checkbot configured
        has_bot = (await db.execute(
            select(Chatbot.id).where(Chatbot.organization_id == organization_id).limit(1)
        )).scalar_one_or_none()
        if has_bot:
            checklist.chatbot_configured = True

        # 2. Knowledge uploaded
        has_kb = (await db.execute(
            select(KnowledgeSource.id).where(KnowledgeSource.organization_id == organization_id).limit(1)
        )).scalar_one_or_none()
        if has_kb:
            checklist.knowledge_uploaded = True

        # 3. Test chat
        has_chat = (await db.execute(
            select(Conversation.id).where(Conversation.organization_id == organization_id).limit(1)
        )).scalar_one_or_none()
        if has_chat:
            checklist.first_test_chat = True

        steps = [
            checklist.account_created,
            checklist.chatbot_configured,
            checklist.knowledge_uploaded,
            checklist.appearance_customized,
            checklist.widget_installed,
            checklist.calendar_connected,
            checklist.first_test_chat,
        ]
        if all(steps) and not checklist.completed_at:
            checklist.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(checklist)
        return checklist

    @staticmethod
    def to_read_dto(checklist: OnboardingChecklist) -> OnboardingChecklistRead:
        steps = [
            checklist.account_created,
            checklist.chatbot_configured,
            checklist.knowledge_uploaded,
            checklist.appearance_customized,
            checklist.widget_installed,
            checklist.calendar_connected,
            checklist.first_test_chat,
        ]
        completed_count = sum(1 for s in steps if s)
        total_steps = len(steps)
        percentage = round((completed_count / total_steps) * 100.0, 1)

        return OnboardingChecklistRead(
            id=checklist.id,
            organization_id=checklist.organization_id,
            account_created=checklist.account_created,
            chatbot_configured=checklist.chatbot_configured,
            knowledge_uploaded=checklist.knowledge_uploaded,
            appearance_customized=checklist.appearance_customized,
            widget_installed=checklist.widget_installed,
            calendar_connected=checklist.calendar_connected,
            first_test_chat=checklist.first_test_chat,
            completed_at=checklist.completed_at,
            completion_percentage=percentage,
            completed_steps=completed_count,
            total_steps=total_steps
        )
