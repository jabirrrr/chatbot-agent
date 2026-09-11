import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class Lead(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents a prospective customer lead captured automatically during a chat interaction.
    """
    __tablename__ = "leads"

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    chatbot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chatbots.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), default="new", nullable=False)  # 'new', 'contacted', 'qualified', 'converted'
    notes = Column(Text, nullable=True)
