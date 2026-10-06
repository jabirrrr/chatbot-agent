import asyncio
import uuid
import datetime
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.services.calendar_tools import CalendarToolsExecutor

async def test_get_availability():
    async with AsyncSessionLocal() as db:
        org_name = f"Test_Calendar_Org_{uuid.uuid4().hex[:6]}"
        org = Organization(name=org_name, slug=org_name.lower(), timezone="UTC")
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
        from app.services.integration_service import IntegrationService
        await IntegrationService.save_integration(
            db=db,
            organization_id=org.id,
            provider="google_calendar",
            credentials={"refresh_token": "1//mock_refresh_token_test"},
            metadata={"account_email": "test@example.com"}
        )
        
        args = {
            "target_date": "2026-10-07",
            "duration_minutes": 30
        }
        
        result = await CalendarToolsExecutor.handle_get_availability(
            db=db,
            organization_id=org.id,
            args=args
        )

        if result.get("success"):
            print("✅ Successfully got availability!")
            print(result)
        else:
            print("❌ Failed to get availability.")
            print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_get_availability())
