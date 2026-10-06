import asyncio
import uuid
import datetime
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.services.calendar_tools import CalendarToolsExecutor

async def test_create_event():
    async with AsyncSessionLocal() as db:
        # Create a completely new isolated organization
        org_name = f"Test_Calendar_Org_{uuid.uuid4().hex[:6]}"
        org = Organization(name=org_name, slug=org_name.lower(), timezone="UTC")
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
        print(f"✅ Created isolated Organization: {org.name} ({org.id})")
        
        # Inject mock Google Calendar integration for testing
        from app.services.integration_service import IntegrationService
        await IntegrationService.save_integration(
            db=db,
            organization_id=org.id,
            provider="google_calendar",
            credentials={"refresh_token": "1//mock_refresh_token_test"},
            metadata={"account_email": "test@example.com"}
        )
        print("✅ Injected mock Google Calendar credentials.")
        
        # Determine a future time (tomorrow at 2 PM UTC)
        tomorrow = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
        start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)

        args = {
            "attendee_name": "Test User",
            "attendee_email": "test@example.com",
            "start_time": start_time.isoformat(),
            "duration_minutes": 30,
            "summary": "Helio AI Test Consultation",
            "notes": "This is a test appointment booked automatically by the test script."
        }

        print(f"📅 Attempting to create event for {args['start_time']}...")
        
        result = await CalendarToolsExecutor.handle_create_event(
            db=db,
            organization_id=org.id,
            conversation_id=None,
            lead_id=None,
            args=args
        )

        if result.get("success"):
            print("✅ Successfully created calendar event!")
            print(f"Event ID: {result.get('event_id')}")
            print(f"Meeting Link: {result.get('meeting_link')}")
            print(f"Appointment DB ID: {result.get('appointment_id')}")
        else:
            print("❌ Failed to create event.")
            print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_create_event())
