from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class BetaDeployment(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Tracks pilot onboarding and deployment status for closed beta SMB organizations.
    Fulfills Milestone M8 exit criteria (>70% widget deployment verification).
    """
    __tablename__ = "beta_deployments"

    industry = Column(String(100), nullable=False)  # 'marketing_agency', 'professional_services', 'real_estate'
    target_domain = Column(String(255), nullable=True)
    is_deployed = Column(Boolean, default=False, nullable=False)
    last_ping_at = Column(DateTime(timezone=True), nullable=True)
    activation_stage = Column(String(50), default="registered", nullable=False)  # 'registered', 'bot_configured', 'kb_uploaded', 'deployed', 'active_leads'


class BetaFeedback(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Stores qualitative feedback, NPS scores, and enhancement requests submitted by beta users.
    """
    __tablename__ = "beta_feedback"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    nps_score = Column(Integer, nullable=False)  # 1 to 10
    category = Column(String(50), default="general", nullable=False)  # 'onboarding', 'widget', 'rag', 'calendar', 'crm'
    feedback_text = Column(Text, nullable=False)
    feature_request = Column(Text, nullable=True)
