import uuid
import secrets
from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class Conversation(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents an ongoing or completed chat conversation between a visitor and the chatbot.
    """
    __tablename__ = "conversations"

    chatbot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chatbots.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    visitor_id = Column(String(128), nullable=False, index=True)
    session_token = Column(
        String(128),
        unique=True,
        index=True,
        default=lambda: f"ses_{secrets.token_urlsafe(32)}",
        nullable=False
    )
    status = Column(String(50), default="active", nullable=False)  # 'active', 'closed', 'handed_off'
    summary = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents an individual message exchanged within a conversation thread.
    """
    __tablename__ = "messages"

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sender_type = Column(String(20), nullable=False)  # 'visitor', 'bot', 'agent', 'system'
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    tokens_used = Column(Integer, default=0, nullable=False)
