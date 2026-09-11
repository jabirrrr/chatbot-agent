from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin
from app.models.organization_member import MemberRole


class Invitation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Tracks pending team invitations for organizations.
    """
    __tablename__ = "invitations"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    email = Column(String(255), nullable=False, index=True)
    role = Column(
        Enum(MemberRole, native_enum=False),
        default=MemberRole.MEMBER,
        nullable=False
    )
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    organization = relationship("Organization", back_populates="invitations")

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at

    def __repr__(self) -> str:
        return f"<Invitation {self.email} role={self.role} org={self.organization_id}>"
