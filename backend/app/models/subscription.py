from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Tracks organization subscription tier and Stripe billing status.
    Fulfills REQ-BILLING-01, REQ-BILLING-02, REQ-BILLING-03.
    """
    __tablename__ = "subscriptions"

    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, index=True)
    plan_tier = Column(String(50), default="free", nullable=False)  # 'free', 'starter', 'professional'
    status = Column(String(50), default="active", nullable=False)  # 'active', 'trialing', 'past_due', 'cancelled'
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)


class ProcessedWebhookEvent(Base):
    """
    Ensures idempotent processing of Stripe webhook events.
    Fulfills REQ-BILLING-03.
    """
    __tablename__ = "processed_webhook_events"

    event_id = Column(String(255), primary_key=True)
    event_type = Column(String(100), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
