from sqlalchemy import Column, String, Boolean, DateTime, JSON
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class ApiKey(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Stores SHA-256 hashed API keys for machine-to-machine public API access.
    Fulfills REQ-INT-03.
    """
    __tablename__ = "api_keys"

    name = Column(String(100), nullable=False)
    prefix = Column(String(16), nullable=False)  # e.g. "cba_live_7a9f"
    hashed_key = Column(String(255), unique=True, index=True, nullable=False)
    scopes = Column(JSON, default=list, nullable=False)  # e.g. ["leads:read", "leads:write"]
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
