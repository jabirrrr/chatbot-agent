from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Organization/Workspace entity representing a tenant (e.g. Northstar Studio).
    Guarantees boundary isolation for chatbots, documents, leads, and billing.
    """
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    website = Column(String(512), nullable=True)
    industry = Column(String(100), nullable=True)
    timezone = Column(String(100), default="America/Chicago", nullable=False)
    subscription_status = Column(String(50), default="free", nullable=False)

    # Relationships
    members = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    invitations = relationship(
        "Invitation",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Organization {self.name} ({self.slug})>"
