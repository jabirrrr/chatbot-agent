import re
import sys

filepath = "e:\\webverse files\\antigravity\\chat-agent\\backend\\app\\services\\calendar_tools.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handle_get_availability
avail_insert = """        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        if calcom and calcom.credentials_json and calcom.credentials_json.get("api_key"):
            api_key = calcom.credentials_json["api_key"]
            event_type_id = calcom.metadata_json.get("event_type_id")
            from app.adapters.calendar.calcom import CalComService
            from datetime import timedelta
            
            end_date_str = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")
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

"""
content = re.sub(
    r'(token, err = await IntegrationService\.get_valid_access_token\(db, organization_id, "google_calendar"\))',
    avail_insert + r'\1',
    content,
    count=1
)

# 2. Update handle_create_event
create_insert = """        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        if calcom and calcom.credentials_json and calcom.credentials_json.get("api_key"):
            api_key = calcom.credentials_json["api_key"]
            event_type_id = calcom.metadata_json.get("event_type_id")
            from app.adapters.calendar.calcom import CalComService
            
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

"""
content = re.sub(
    r'(token, err = await IntegrationService\.get_valid_access_token\(db, organization_id, "google_calendar"\))',
    create_insert + r'\1',
    content,
    count=1
)

# 3. Update handle_cancel_event
cancel_insert = """        # Check Cal.com first
        calcom = await IntegrationService.get_integration(db, organization_id, "calcom")
        if calcom and calcom.credentials_json and calcom.credentials_json.get("api_key"):
            api_key = calcom.credentials_json["api_key"]
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

"""
content = re.sub(
    r'(token, err = await IntegrationService\.get_valid_access_token\(db, organization_id, "google_calendar"\))',
    cancel_insert + r'\1',
    content,
    count=1
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("calendar_tools.py successfully updated for Cal.com!")
