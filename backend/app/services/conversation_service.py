import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationUpdate


class ConversationService:
    @staticmethod
    async def list_conversations(
        db: AsyncSession,
        organization_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Conversation], int]:
        stmt = select(Conversation).where(Conversation.organization_id == organization_id)

        if chatbot_id:
            stmt = stmt.where(Conversation.chatbot_id == chatbot_id)
        if status:
            stmt = stmt.where(Conversation.status == status)
        if search:
            search_term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Conversation.visitor_id.ilike(search_term),
                    Conversation.summary.ilike(search_term)
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        # Execute paged query
        stmt = stmt.order_by(desc(Conversation.updated_at)).limit(limit).offset(offset)
        result = await db.execute(stmt)
        conversations = list(result.scalars().all())

        return conversations, total

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None
    ) -> Optional[Conversation]:
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.organization_id == organization_id
        )
        if chatbot_id:
            stmt = stmt.where(Conversation.chatbot_id == chatbot_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_conversation_with_messages(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None
    ) -> Optional[Tuple[Conversation, List[Message]]]:
        conv = await ConversationService.get_conversation(db, organization_id, conversation_id, chatbot_id=chatbot_id)
        if not conv:
            return None

        stmt = select(Message).where(
            Message.conversation_id == conversation_id,
            Message.organization_id == organization_id
        ).order_by(Message.created_at.asc())
        result = await db.execute(stmt)
        messages = list(result.scalars().all())

        return conv, messages

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        update_data: ConversationUpdate
    ) -> Optional[Conversation]:
        conv = await ConversationService.get_conversation(db, organization_id, conversation_id)
        if not conv:
            return None

        if update_data.status is not None:
            conv.status = update_data.status
        if update_data.summary is not None:
            conv.summary = update_data.summary
        if update_data.metadata_json is not None:
            conv.metadata_json = update_data.metadata_json

        await db.commit()
        await db.refresh(conv)
        return conv
