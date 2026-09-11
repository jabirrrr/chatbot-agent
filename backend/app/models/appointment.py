from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class Appointment(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents a meeting or consultation booked by a visitor.
    Fulfills REQ-APPT-01, REQ-APPT-02, REQ-APPT-03.
    """
    __tablename__ = "appointments"

    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    attendee_name = Column(String(255), nullable=False)
    attendee_email = Column(String(255), nullable=False, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)  # 'scheduled', 'completed', 'cancelled'
    meeting_link = Column(String(512), nullable=True)
    provider_event_id = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
