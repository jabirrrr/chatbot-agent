import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr
from app.core.database import Base


class TimestampMixin:
    """Provides automatic UTC timestamps for record creation and updates."""
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class UUIDPrimaryKeyMixin:
    """Provides a UUID primary key for secure, non-sequential entity identification."""
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False
    )


class TenantMixin:
    """
    Enforces strict multi-tenant data isolation.
    Every tenant-scoped entity MUST inherit this mixin.
    """
    @declared_attr
    def organization_id(cls):
        return Column(
            UUID(as_uuid=True),
            ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
