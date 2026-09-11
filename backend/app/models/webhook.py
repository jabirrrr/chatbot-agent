from sqlalchemy import Column, String, Boolean, JSON
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class WebhookEndpoint(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Configures outbound webhook endpoints with HMAC-SHA256 verification.
    Fulfills REQ-INT-02.
    """
    __tablename__ = "webhook_endpoints"

    url = Column(String(512), nullable=False)
    secret = Column(String(255), nullable=False)  # HMAC signing secret
    events = Column(JSON, default=list, nullable=False)  # e.g. ["lead.created", "conversation.completed"]
    is_active = Column(Boolean, default=True, nullable=False)
