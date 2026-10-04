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
    },
    {
        "type": "function",
        "function": {
            "name": "search_calendar_events",
            "description": "Searches for a user's upcoming appointments by their email address. Use this to find the event_id before rescheduling or canceling.",
            "parameters": {
                "type": "object",
                "properties": {
                    "attendee_email": {"type": "string", "description": "The customer's email address"}
                },
                "required": ["attendee_email"]
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
        elif tool_name == "search_calendar_events":
            return await cls.handle_search_events(db, organization_id, arguments)
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
        raw_duration = args.get("duration_minutes")
        try:
            duration_minutes = int(raw_duration) if raw_duration is not None else 30
        except (ValueError, TypeError):
            duration_minutes = 30

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

        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        api_key = None
        if calcom and calcom.encrypted_credentials:
            from app.core.vault import decrypt_vault_secret
            import json
            try:
                creds_json = decrypt_vault_secret(calcom.encrypted_credentials)
                creds = json.loads(creds_json)
                api_key = creds.get("api_key")
            except Exception:
                pass
                
        if api_key:
            from app.adapters.calendar.calcom import CalComService
            event_type_id = calcom.metadata_json.get("event_type_id") if calcom.metadata_json else None
            if not event_type_id:
                event_type_id = await CalComService.get_default_event_type_id(api_key)
            
            end_date_str = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")
            target_date_str = target_date.strftime("%Y-%m-%d")
            slots = await CalComService.get_availability(api_key, event_type_id, target_date_str, end_date_str)
            
            return {
                "success": True,
                "target_date": target_date_str,
                "available_slots": [
                    {
                        "start_time": s.get("start"),
                        "end_time": (datetime.fromisoformat(s.get("start").replace("Z", "+00:00")) + timedelta(minutes=duration_minutes)).isoformat(),
                        "label": "Available"
                    }
                    for s in slots
                ]
            }

        return {
            "success": False,
            "error": "Cal.com is not connected for this business.",
            "slots": []
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
        raw_duration = args.get("duration_minutes")
        try:
            duration_minutes = int(raw_duration) if raw_duration is not None else 30
        except (ValueError, TypeError):
            duration_minutes = 30
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

        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        api_key = None
        if calcom and calcom.encrypted_credentials:
            from app.core.vault import decrypt_vault_secret
            import json
            try:
                creds_json = decrypt_vault_secret(calcom.encrypted_credentials)
                creds = json.loads(creds_json)
                api_key = creds.get("api_key")
            except Exception:
                pass
                
        if api_key:
            from app.adapters.calendar.calcom import CalComService
            event_type_id = calcom.metadata_json.get("event_type_id") if calcom.metadata_json else None
            if not event_type_id:
                event_type_id = await CalComService.get_default_event_type_id(api_key)
            
            booking = await CalComService.create_booking(
                api_key=api_key, 
                event_type_id=event_type_id,
                name=attendee_name,
                email=attendee_email,
                start_time=start_time.isoformat(),
                timezone=org_tz_str
            )
            
            if not booking:
                return {"success": False, "error": "Failed to create booking in Cal.com"}
            
            appointment = Appointment(
                organization_id=organization_id,
                conversation_id=conversation_id,
                lead_id=lead_id,
                attendee_name=attendee_name,
                attendee_email=attendee_email,
                scheduled_at=start_time,
                duration_minutes=duration_minutes,
                status="scheduled",
                meeting_link=booking.get("metadata", {}).get("videoCallUrl", "") if booking.get("metadata") else "",
                provider_event_id=str(booking.get("uid")),
                notes=notes
            )
            db.add(appointment)
            await db.commit()
            
            return {
                "success": True,
                "appointment_id": str(appointment.id),
                "event_id": str(booking.get("uid")),
                "meeting_link": appointment.meeting_link,
                "scheduled_at": start_time.isoformat(),
                "attendee_name": attendee_name,
                "attendee_email": attendee_email,
                "message": f"Appointment successfully scheduled with {attendee_name} via Cal.com."
            }

        return {
            "success": False,
            "error": "Cal.com is not connected or configured."
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

        return {"success": False, "error": "Event retrieval via provider is not supported yet for Cal.com"}

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

        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        api_key = None
        if calcom and calcom.encrypted_credentials:
            from app.core.vault import decrypt_vault_secret
            import json
            try:
                creds_json = decrypt_vault_secret(calcom.encrypted_credentials)
                creds = json.loads(creds_json)
                api_key = creds.get("api_key")
            except Exception:
                pass
                
        if api_key:
            from app.adapters.calendar.calcom import CalComService
            
            cancelled = await CalComService.cancel_booking(api_key, event_id)
            
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
                "message": "Appointment cancelled via Cal.com." if cancelled else "Failed to cancel event on Cal.com."
            }

        return {"success": False, "error": "Cal.com integration not connected"}

    @classmethod
    async def handle_update_event(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        event_id = args.get("event_id")
        start_time_str = args.get("start_time")
        if not event_id:
            return {"success": False, "error": "event_id is required"}
        if not start_time_str:
            return {"success": False, "error": "start_time is required to reschedule"}

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

        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        api_key = None
        if calcom and calcom.encrypted_credentials:
            from app.core.vault import decrypt_vault_secret
            import json
            try:
                creds_json = decrypt_vault_secret(calcom.encrypted_credentials)
                creds = json.loads(creds_json)
                api_key = creds.get("api_key")
            except Exception:
                pass
                
        if api_key:
            from app.adapters.calendar.calcom import CalComService
            
            booking = await CalComService.reschedule_booking(
                api_key=api_key, 
                booking_uid=event_id,
                new_start_time=start_time.isoformat()
            )
            
            if not booking:
                return {"success": False, "error": "Failed to reschedule booking in Cal.com"}
                
            # Update local appointment
            stmt = select(Appointment).where(
                Appointment.organization_id == organization_id,
                Appointment.provider_event_id == event_id
            )
            res = await db.execute(stmt)
            appt = res.scalar_one_or_none()
            if appt:
                appt.scheduled_at = start_time
                new_uid = str(booking.get("uid"))
                if new_uid and new_uid != "None":
                    appt.provider_event_id = new_uid
                    event_id = new_uid
                
                # Rescheduled meeting link might change
                if booking.get("metadata") and booking.get("metadata").get("videoCallUrl"):
                    appt.meeting_link = booking.get("metadata").get("videoCallUrl")
                    
                await db.commit()
                
            return {
                "success": True,
                "event_id": event_id,
                "scheduled_at": start_time.isoformat(),
                "message": "Appointment successfully rescheduled via Cal.com."
            }

        return {"success": False, "error": "Cal.com is not connected or configured."}

    @classmethod
    async def handle_search_events(
        cls, db: AsyncSession, organization_id: uuid.UUID, args: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Searches local database for upcoming appointments by email address.
        """
        email = args.get("attendee_email")
        if not email:
            return {"success": False, "error": "Missing attendee_email"}

        stmt = select(Appointment).where(
            Appointment.organization_id == organization_id,
            Appointment.attendee_email == email,
            Appointment.status == "scheduled"
        ).order_by(Appointment.scheduled_at.desc()).limit(5)
        
        res = await db.execute(stmt)
        appointments = res.scalars().all()

        if not appointments:
            return {"success": True, "events": [], "message": f"No confirmed appointments found for {email}."}

        events = []
        for appt in appointments:
            events.append({
                "event_id": appt.provider_event_id,
                "start_time": appt.scheduled_at.isoformat() if appt.scheduled_at else None,
                "attendee_name": appt.attendee_name,
                "notes": appt.notes,
                "meeting_link": appt.meeting_link
            })

        return {
            "success": True,
            "events": events,
            "message": f"Found {len(events)} appointment(s) for {email}."
        }
