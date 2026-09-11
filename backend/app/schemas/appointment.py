import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class SlotRead(BaseModel):
    start_time: datetime
    end_time: datetime
    label: str


class AvailabilityRequest(BaseModel):
    date: str = Field(..., description="Target date in YYYY-MM-DD format")


class AppointmentCreate(BaseModel):
    attendee_name: str
    attendee_email: EmailStr
    scheduled_at: datetime
    duration_minutes: int = 30
    lead_id: Optional[uuid.UUID] = None
    conversation_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class AppointmentRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    lead_id: Optional[uuid.UUID] = None
    conversation_id: Optional[uuid.UUID] = None
    attendee_name: str
    attendee_email: str
    scheduled_at: datetime
    duration_minutes: int
    status: str
    meeting_link: Optional[str] = None
    provider_event_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HandoffRequest(BaseModel):
    reason: Optional[str] = Field("Visitor requested a human agent", description="Reason for handoff")


class TakeoverRequest(BaseModel):
    notes: Optional[str] = None
