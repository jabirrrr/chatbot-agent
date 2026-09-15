import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.organization import Organization
from app.models.chatbot import Chatbot
from app.models.integration import TenantIntegration
from app.models.conversation import Conversation
from app.core.vault import encrypt_vault_secret
from app.services.rag_service import RAGService
from app.adapters.llm.provider import OpenRouterProvider

# This script directly tests the backend RAGService with a real LLM.

async def main():
    engine = create_async_engine(settings.DATABASE_ASYNC_URL)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    org_id = uuid.uuid4()
    bot_id = uuid.uuid4()
    conv_id = uuid.uuid4()

    async with SessionLocal() as db:
        # Create test organization
        org = Organization(id=org_id, name="Test Org", slug=f"test-{org_id.hex[:6]}", timezone="America/Chicago")
        db.add(org)
        await db.commit()

        # Create test integration
        integration = TenantIntegration(
            id=uuid.uuid4(),
            organization_id=org_id,
            provider="google_calendar",
            encrypted_credentials=encrypt_vault_secret('{"access_token": "ya29.mock_token", "refresh_token": "1//mock_refresh", "stored_at": 1700000000, "expires_in": 3600}'),
            status="connected",
            metadata_json={"account_email": "scheduler@org.com"}
        )
        db.add(integration)

        # Create chatbot
        chatbot = Chatbot(
            id=bot_id,
            organization_id=org_id,
            name="E2E Booking Bot",
            system_prompt="You are a helpful assistant that schedules appointments. When the user asks to book an appointment, ask for their name, email, and preferred time. Use the calendar tools to find availability and book the appointment. Keep responses brief.",
            fallback_message="Sorry, error.",
            appointment_booking_enabled=True,
            lead_capture_enabled=True,
            model_name="anthropic/claude-3-haiku", # use a fast model
            temperature=0.3,
            max_tokens=500
        )
        db.add(chatbot)

        # Create conversation
        conv = Conversation(
            id=conv_id,
            organization_id=org_id,
            chatbot_id=bot_id,
            visitor_id="vis_e2e_123",
            status="active"
        )
        db.add(conv)
        await db.commit()

        print("--- E2E Database setup complete ---")

        # Start conversation
        print("\nUser: I want to book an appointment for tomorrow.")
        llm = OpenRouterProvider()
        
        async def send_message(msg):
            full_reply = ""
            async for event in RAGService.handle_message_stream(db, conv, chatbot, msg, llm_provider=llm):
                if event["event"] == "delta":
                    full_reply += event["data"]
                    print(event["data"], end="", flush=True)
                elif event["event"] == "appointment_booked":
                    print("\n\n[SYSTEM] Appointment Booked!", event["data"])
            print("\n")
            return full_reply

        reply = await send_message("I want to book an appointment for tomorrow.")
        
        print("\nUser: I want to book an appointment for Alice Test at alice@test.com on 2026-09-20 at 10 AM.")
        reply = await send_message("I want to book an appointment for Alice Test at alice@test.com on 2026-09-20 at 10 AM.")

        print("\nUser: Please cancel that appointment.")
        reply = await send_message("Please cancel that appointment.")

        print("\n--- E2E Test Finished ---")

if __name__ == "__main__":
    asyncio.run(main())
