import enum
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class OrganizationMember(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Associative entity linking users to organizations with Role-Based Access Control (RBAC).
    """
    __tablename__ = "organization_members"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = Column(
        Enum(MemberRole, native_enum=False),
        default=MemberRole.MEMBER,
        nullable=False
    )

    # Relationships
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )

    def __repr__(self) -> str:
        return f"<OrganizationMember user={self.user_id} org={self.organization_id} role={self.role}>"
