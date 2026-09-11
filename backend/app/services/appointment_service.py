import uuid
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate
from app.adapters.calendar.provider import CalendarProvider, MockCalendarAdapter


class AppointmentService:
    @staticmethod
    async def list_appointments(
        db: AsyncSession,
        organization_id: uuid.UUID,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Appointment], int]:
        stmt = select(Appointment).where(Appointment.organization_id == organization_id)
        if status:
            stmt = stmt.where(Appointment.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Appointment.scheduled_at)).limit(limit).offset(offset)
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def create_appointment(
        db: AsyncSession,
        organization_id: uuid.UUID,
        data: AppointmentCreate,
        calendar_provider: Optional[CalendarProvider] = None
    ) -> Appointment:
        provider = calendar_provider or MockCalendarAdapter()
        booking = await provider.create_booking(
            start_time=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            attendee_name=data.attendee_name,
            attendee_email=str(data.attendee_email),
            summary=f"Consultation with {data.attendee_name}"
        )

        appointment = Appointment(
            organization_id=organization_id,
            lead_id=data.lead_id,
            conversation_id=data.conversation_id,
            attendee_name=data.attendee_name,
            attendee_email=str(data.attendee_email),
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            status="scheduled" if booking.success else "failed",
            meeting_link=booking.meeting_link,
            provider_event_id=booking.event_id,
            notes=data.notes if booking.success else f"Booking error: {booking.error_message}"
        )
        db.add(appointment)
        await db.commit()
        await db.refresh(appointment)
        return appointment

    @staticmethod
    async def cancel_appointment(
        db: AsyncSession,
        organization_id: uuid.UUID,
        appointment_id: uuid.UUID
    ) -> Optional[Appointment]:
        stmt = select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.organization_id == organization_id
        )
        result = await db.execute(stmt)
        appt = result.scalar_one_or_none()
        if not appt:
            return None

        appt.status = "cancelled"
        await db.commit()
        await db.refresh(appt)
        return appt
