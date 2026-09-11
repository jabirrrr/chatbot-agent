from sqlalchemy import Column, String, Text, JSON
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class TenantIntegration(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Tracks third-party integrations (e.g. Google Calendar OAuth) per tenant organization.
    Stores encrypted credentials secured with AES-256-GCM.
    Fulfills REQ-INT-01 and REQ-APPT-01.
    """
    __tablename__ = "tenant_integrations"

    provider = Column(String(50), nullable=False, index=True)  # 'google_calendar', 'slack', 'webhook'
    encrypted_credentials = Column(Text, nullable=False)  # AES-256-GCM encrypted payload
    status = Column(String(50), default="connected", nullable=False)  # 'connected', 'needs_reconnect', 'disabled'
    metadata_json = Column(JSON, nullable=True)
