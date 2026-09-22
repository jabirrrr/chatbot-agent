import uuid
from decimal import Decimal
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class AIUsageRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Tracks AI token consumption and per-tenant cost accounting per model invocation.
    Fulfills REQ-ANALYTICS-05.
    """
    __tablename__ = "ai_usage_records"

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    provider = Column(String(50), default="openrouter", nullable=False)
    model = Column(String(100), default="anthropic/claude-sonnet-5", nullable=False, index=True)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    estimated_cost_usd = Column(Numeric(10, 6), default=Decimal("0.000000"), nullable=False)
