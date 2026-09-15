import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.appointment import Appointment
from app.models.organization import Organization
from app.services.integration_service import IntegrationService
from app.adapters.calendar.google_calendar import GoogleCalendarService
import zoneinfo


CALENDAR_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_calendar_availability",
            "description": "Checks available consultation or meeting slots on the business calendar for a specific date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_date": {
                        "type": "string",
                        "description": "Target date formatted as YYYY-MM-DD (e.g., '2026-09-20')"
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Meeting duration in minutes (default 30)",
                        "default": 30
                    }
                },
                "required": ["target_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Books a confirmed appointment directly in Google Calendar and records it in the system. Only call when user has confirmed date, time, name, and email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "attendee_name": {"type": "string", "description": "Customer full name"},
                    "attendee_email": {"type": "string", "description": "Customer email address"},
                    "start_time": {
                        "type": "string",
                        "description": "ISO 8601 formatted start time (e.g., '2026-09-20T14:00:00Z')"
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Duration in minutes (default 30)",
                        "default": 30
                    },
                    "summary": {
                        "type": "string",
                        "description": "Title or summary of meeting (e.g. 'Consultation Session')"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Meeting notes, agenda, or visitor requirements"
                    }
                },
                "required": ["attendee_name", "attendee_email", "start_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_calendar_event",
            "description": "Retrieves details of an existing calendar event using its event ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The Google Calendar event ID"}
                },
                "required": ["event_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_calendar_event",
            "description": "Cancels and deletes an existing appointment from Google Calendar and the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The Google Calendar event ID"}
                },
                "required": ["event_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_calendar_event",
            "description": "Reschedules or updates the details/summary/notes of an existing calendar event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The Google Calendar event ID"},
                    "start_time": {
                        "type": "string",
                        "description": "New ISO 8601 formatted start time (e.g. '2026-09-21T15:00:00Z')"
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Updated duration in minutes"
                    },
                    "summary": {
                        "type": "string",
                        "description": "Updated event summary/title"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Updated event description/notes"
                    }
                },
                "required": ["event_id"]
            }
        }
    }
]


class CalendarToolsExecutor:
    """
    Executes appointment scheduling tool calls against tenant's Google Calendar.
    Enforces strict multi-tenant isolation and guarantees appointments are only
    confirmed upon successful Google Calendar creation.
    """

    @classmethod
    async def execute_tool(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID] = None,
        lead_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        if tool_name == "get_calendar_availability":
            return await cls.handle_get_availability(db, organization_id, arguments)
        elif tool_name == "create_calendar_event":
            return await cls.handle_create_event(db, organization_id, conversation_id, lead_id, arguments)
        elif tool_name == "get_calendar_event":
            return await cls.handle_get_event(db, organization_id, arguments)
        elif tool_name == "cancel_calendar_event":
            return await cls.handle_cancel_event(db, organization_id, arguments)
        elif tool_name == "update_calendar_event":
            return await cls.handle_update_event(db, organization_id, arguments)
        else:
            return {"success": False, "error": f"Unknown tool: {tool_name}"}

    @classmethod
    async def handle_get_availability(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        target_date_str = args.get("target_date")
        duration_minutes = args.get("duration_minutes", 30)

        if not target_date_str:
            return {"success": False, "error": "target_date is required"}

        # Get organization for timezone
        stmt = select(Organization).where(Organization.id == organization_id)
        res = await db.execute(stmt)
        org = res.scalar_one_or_none()
        org_tz_str = org.timezone if org and org.timezone else "America/Chicago"
        try:
            org_tz = zoneinfo.ZoneInfo(org_tz_str)
        except Exception:
            org_tz = timezone.utc

        try:
            target_date = datetime.fromisoformat(target_date_str.replace("Z", "+00:00"))
            if target_date.tzinfo is None:
                target_date = target_date.replace(tzinfo=org_tz)
            else:
                target_date = target_date.astimezone(org_tz)
        except Exception:
            try:
                target_date = datetime.strptime(target_date_str, "%Y-%m-%d").replace(tzinfo=org_tz)
            except Exception:
                return {"success": False, "error": "Invalid date format. Use YYYY-MM-DD"}

        token, err = await IntegrationService.get_valid_access_token(db, organization_id, "google_calendar")
        if err or not token:
            return {
                "success": False,
                "error": "Google Calendar is not connected for this business.",
                "slots": []
            }

        slots = await GoogleCalendarService.get_calendar_availability(
            access_token=token,
            target_date=target_date,
            duration_minutes=duration_minutes
        )

        return {
            "success": True,
            "target_date": target_date_str,
            "available_slots": [
                {
                    "start_time": s.start_time.isoformat(),
                    "end_time": s.end_time.isoformat(),
                    "label": s.label
                }
                for s in slots
            ]
        }

    @classmethod
    async def handle_create_event(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID],
        lead_id: Optional[uuid.UUID],
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        attendee_name = args.get("attendee_name")
        attendee_email = args.get("attendee_email")
        start_time_str = args.get("start_time")
        duration_minutes = int(args.get("duration_minutes", 30))
        summary = args.get("summary")
        notes = args.get("notes")

        if not (attendee_name and attendee_email and start_time_str):
            return {
                "success": False,
                "error": "attendee_name, attendee_email, and start_time are required to book an appointment"
            }

        # Get organization for timezone
        stmt = select(Organization).where(Organization.id == organization_id)
        res = await db.execute(stmt)
        org = res.scalar_one_or_none()
        org_tz_str = org.timezone if org and org.timezone else "America/Chicago"
        try:
            org_tz = zoneinfo.ZoneInfo(org_tz_str)
        except Exception:
            org_tz = timezone.utc

        try:
            start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=org_tz)
        except Exception:
            return {"success": False, "error": "Invalid start_time format. Use ISO 8601 string."}

        token, err = await IntegrationService.get_valid_access_token(db, organization_id, "google_calendar")
        if err or not token:
            return {
                "success": False,
                "error": "Google Calendar integration is not active or authorized."
            }

        # Call Google Calendar API to create event
        booking_result = await GoogleCalendarService.create_calendar_event(
            access_token=token,
            start_time=start_time,
            duration_minutes=duration_minutes,
            attendee_name=attendee_name,
            attendee_email=attendee_email,
            summary=summary,
            notes=notes
        )

        if not booking_result.success:
            return {
                "success": False,
                "error": f"Failed to create Google Calendar event: {booking_result.error_message}"
            }

        # Store confirmed appointment in DB (Requirement 15: only claim booked when Google creates event)
        appointment = Appointment(
            organization_id=organization_id,
            conversation_id=conversation_id,
            lead_id=lead_id,
            attendee_name=attendee_name,
            attendee_email=attendee_email,
            scheduled_at=start_time,
            duration_minutes=duration_minutes,
            status="scheduled",
            meeting_link=booking_result.meeting_link,
            provider_event_id=booking_result.event_id,
            notes=notes
        )
        db.add(appointment)
        await db.commit()
        await db.refresh(appointment)

        return {
            "success": True,
            "appointment_id": str(appointment.id),
            "event_id": booking_result.event_id,
            "meeting_link": booking_result.meeting_link,
            "scheduled_at": start_time.isoformat(),
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "message": f"Appointment successfully scheduled with {attendee_name} for {start_time.strftime('%b %d, %Y at %I:%M %p UTC')}."
        }

    @classmethod
    async def handle_get_event(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        event_id = args.get("event_id")
        if not event_id:
            return {"success": False, "error": "event_id is required"}

        token, err = await IntegrationService.get_valid_access_token(db, organization_id, "google_calendar")
        if err or not token:
            return {"success": False, "error": "Google Calendar integration not connected"}

        event_data = await GoogleCalendarService.get_calendar_event(token, event_id)
        if not event_data:
            return {"success": False, "error": f"Event {event_id} not found on Google Calendar"}

        return {"success": True, "event": event_data}

    @classmethod
    async def handle_cancel_event(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        event_id = args.get("event_id")
        if not event_id:
            return {"success": False, "error": "event_id is required"}

        token, err = await IntegrationService.get_valid_access_token(db, organization_id, "google_calendar")
        if err or not token:
            return {"success": False, "error": "Google Calendar integration not connected"}

        cancelled = await GoogleCalendarService.cancel_calendar_event(token, event_id)

        # Update local appointment record if it exists
        stmt = select(Appointment).where(
            Appointment.organization_id == organization_id,
            Appointment.provider_event_id == event_id
        )
        res = await db.execute(stmt)
        appt = res.scalar_one_or_none()
        if appt:
            appt.status = "cancelled"
            await db.commit()

        return {
            "success": cancelled,
            "event_id": event_id,
            "message": "Appointment cancelled successfully." if cancelled else "Failed to cancel event on calendar."
        }

    @classmethod
    async def handle_update_event(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        event_id = args.get("event_id")
        if not event_id:
            return {"success": False, "error": "event_id is required"}

        token, err = await IntegrationService.get_valid_access_token(db, organization_id, "google_calendar")
        if err or not token:
            return {"success": False, "error": "Google Calendar integration not connected"}

        patch_data: Dict[str, Any] = {}
        if "summary" in args:
            patch_data["summary"] = args["summary"]
        if "notes" in args:
            patch_data["description"] = args["notes"]
        if "start_time" in args:
            try:
                st = datetime.fromisoformat(args["start_time"].replace("Z", "+00:00"))
                # If naive, assume UTC or org tz, here we just use what it is if it has tzinfo
                dur = int(args.get("duration_minutes", 30))
                patch_data["start"] = {"dateTime": st.isoformat()}
                patch_data["end"] = {"dateTime": (st + timedelta(minutes=dur)).isoformat()}
            except Exception:
                return {"success": False, "error": "Invalid start_time format"}

        updated_event = await GoogleCalendarService.update_calendar_event(token, event_id, patch_data)
        if not updated_event:
            return {"success": False, "error": "Failed to update Google Calendar event"}

        # Sync local appointment if present
        stmt = select(Appointment).where(
            Appointment.organization_id == organization_id,
            Appointment.provider_event_id == event_id
        )
        res = await db.execute(stmt)
        appt = res.scalar_one_or_none()
        if appt:
            if "start" in patch_data:
                appt.scheduled_at = datetime.fromisoformat(patch_data["start"]["dateTime"])
            if "notes" in args:
                appt.notes = args["notes"]
            await db.commit()

        return {
            "success": True,
            "event_id": event_id,
            "event": updated_event,
            "message": "Appointment updated successfully."
        }
