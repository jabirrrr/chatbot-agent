from datetime import datetime, timezone
from sqlalchemy import Column, Boolean, DateTime
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class OnboardingChecklist(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Tracks self-serve onboarding checklist completion across 7 activation milestones.
    Fulfills Phase 4 / Milestone M9 requirement for automated onboarding.
    """
    __tablename__ = "onboarding_checklists"

    account_created = Column(Boolean, default=True, nullable=False)
    chatbot_configured = Column(Boolean, default=False, nullable=False)
    knowledge_uploaded = Column(Boolean, default=False, nullable=False)
    appearance_customized = Column(Boolean, default=False, nullable=False)
    widget_installed = Column(Boolean, default=False, nullable=False)
    calendar_connected = Column(Boolean, default=False, nullable=False)
    first_test_chat = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
