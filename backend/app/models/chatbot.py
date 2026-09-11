import uuid
import secrets
from sqlalchemy import Column, String, Text, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class Chatbot(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents an AI Chatbot agent belonging to an organization.
    Configures prompt instructions, AI model parameters, and embed widget token.
    """
    __tablename__ = "chatbots"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Prompt Engineering & Tone
    system_prompt = Column(
        Text,
        default="You are a helpful, accurate, and polite customer support assistant for our business.",
        nullable=False
    )
    welcome_message = Column(
        String(1024),
        default="Hi there! 👋 How can I help you today?",
        nullable=False
    )
    fallback_message = Column(
        String(1024),
        default="I'm sorry, I don't have that information. Would you like me to connect you with a team member?",
        nullable=False
    )

    # AI Model Settings
    model_name = Column(String(100), default="anthropic/claude-3.5-sonnet", nullable=False)
    temperature = Column(Float, default=0.3, nullable=False)
    max_tokens = Column(Float, default=1024, nullable=False)

    # Widget Embed Credentials & Customization
    widget_token = Column(
        String(128),
        unique=True,
        index=True,
        default=lambda: f"wgt_{secrets.token_urlsafe(32)}",
        nullable=False
    )
    theme_color = Column(String(50), default="#3b82f6", nullable=False)
    position = Column(String(20), default="bottom-right", nullable=False)
    lead_capture_enabled = Column(Boolean, default=True, nullable=False)
    appointment_booking_enabled = Column(Boolean, default=True, nullable=False)
