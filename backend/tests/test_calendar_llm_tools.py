import uuid
import pytest
from datetime import datetime, timezone, timedelta
from app.core.vault import encrypt_vault_secret
from app.models.integration import TenantIntegration
from app.models.appointment import Appointment
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.services.calendar_tools import CalendarToolsExecutor, CALENDAR_TOOLS
from app.services.integration_service import IntegrationService
from app.services.rag_service import RAGService
from app.adapters.llm.provider import MockLLMProvider
from app.adapters.calendar.google_calendar import GoogleCalendarService


mock_org_id = uuid.uuid4()
mock_bot_id = uuid.uuid4()
mock_conv_id = uuid.uuid4()

mock_integration = TenantIntegration(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    provider="google_calendar",
    encrypted_credentials=encrypt_vault_secret('{"access_token": "ya29.mock_token", "refresh_token": "1//mock_refresh", "stored_at": 1700000000, "expires_in": 3600}'),
    status="connected",
    metadata_json={"account_email": "scheduler@org.com"}
)

mock_chatbot = Chatbot(
    id=mock_bot_id,
    organization_id=mock_org_id,
    name="Booking Bot",
    system_prompt="You are a helpful assistant that schedules appointments.",
    fallback_message="Sorry, let me connect you with a team member.",
    appointment_booking_enabled=True,
    lead_capture_enabled=True,
    model_name="anthropic/claude-sonnet-5",
    temperature=0.3,
    max_tokens=500
)

mock_conversation = Conversation(
    id=mock_conv_id,
    organization_id=mock_org_id,
    chatbot_id=mock_bot_id,
    visitor_id="vis_test_123",
    status="active"
)


class MockDbForTools:
    def __init__(self, connected: bool = True, integration: TenantIntegration = mock_integration):
        self.connected = connected
        self.integration = integration
        self.added_entities = []

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()
        is_integration = "tenant_integrations" in stmt_str
        is_messages = "messages" in stmt_str
        is_appointment = "appointments" in stmt_str
        
        class MockResult:
            def __init__(self, connected, is_int, is_msg, is_appt, integration, added):
                self.connected = connected
                self.is_int = is_int
                self.is_msg = is_msg
                self.is_appt = is_appt
                self.integration = integration
                self.added = added

            def scalar_one_or_none(self):
                if self.connected and self.is_int:
                    return self.integration
                if self.is_appt:
                    appts = [e for e in self.added if isinstance(e, Appointment)]
                    return appts[0] if appts else None
                return None

            def scalars(self):
                class MockScalars:
                    def __init__(self, connected, is_int, is_msg, is_appt, integration, added):
                        self.connected = connected
                        self.is_int = is_int
                        self.is_msg = is_msg
                        self.is_appt = is_appt
                        self.integration = integration
                        self.added = added

                    def all(self):
                        if self.connected and self.is_int:
                            return [self.integration]
                        if self.is_msg:
                            return [e for e in self.added if hasattr(e, "sender_type")]
                        if self.is_appt:
                            return [e for e in self.added if isinstance(e, Appointment)]
                        return []

                    def first(self):
                        if self.connected and self.is_int:
                            return self.integration
                        if self.is_msg:
                            msgs = [e for e in self.added if hasattr(e, "sender_type")]
                            return msgs[0] if msgs else None
                        return None

                return MockScalars(self.connected, self.is_int, self.is_msg, self.is_appt, self.integration, self.added)

        return MockResult(self.connected, is_integration, is_messages, is_appointment, self.integration, self.added_entities)

    def add(self, entity):
        entity.id = uuid.uuid4()
        entity.created_at = datetime.now(timezone.utc)
        self.added_entities.append(entity)

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass

    async def delete(self, entity):
        if entity in self.added_entities:
            self.added_entities.remove(entity)


@pytest.mark.asyncio
async def test_tool_get_calendar_availability():
    db = MockDbForTools(connected=True)
    res = await CalendarToolsExecutor.execute_tool(
        tool_name="get_calendar_availability",
        arguments={"target_date": "2026-09-20", "duration_minutes": 30},
        db=db,
        organization_id=mock_org_id
    )
    assert res["success"] is True
    assert len(res["available_slots"]) > 0


@pytest.mark.asyncio
async def test_tool_create_calendar_event():
    db = MockDbForTools(connected=True)
    res = await CalendarToolsExecutor.execute_tool(
        tool_name="create_calendar_event",
        arguments={
            "attendee_name": "Sarah Connor",
            "attendee_email": "sarah@cyberdyne.org",
            "start_time": "2026-09-20T14:00:00Z",
            "duration_minutes": 30,
            "summary": "AI Consultation"
        },
        db=db,
        organization_id=mock_org_id,
        conversation_id=mock_conv_id
    )
    assert res["success"] is True
    assert res["event_id"] is not None
    assert "meeting_link" in res
    assert len(db.added_entities) > 0
    created_appt = db.added_entities[0]
    assert isinstance(created_appt, Appointment)
    assert created_appt.attendee_name == "Sarah Connor"
    assert created_appt.status == "scheduled"


@pytest.mark.asyncio
async def test_tool_get_and_update_and_cancel_event():
    db = MockDbForTools(connected=True)
    
    # 1. Get event
    get_res = await CalendarToolsExecutor.execute_tool(
        tool_name="get_calendar_event",
        arguments={"event_id": "gcal_evt_123"},
        db=db,
        organization_id=mock_org_id
    )
    assert get_res["success"] is True
    assert get_res["event"]["id"] == "gcal_evt_123"

    # 2. Update event
    update_res = await CalendarToolsExecutor.execute_tool(
        tool_name="update_calendar_event",
        arguments={"event_id": "gcal_evt_123", "summary": "New Title"},
        db=db,
        organization_id=mock_org_id
    )
    assert update_res["success"] is True

    # 3. Cancel event
    cancel_res = await CalendarToolsExecutor.execute_tool(
        tool_name="cancel_calendar_event",
        arguments={"event_id": "gcal_evt_123"},
        db=db,
        organization_id=mock_org_id
    )
    assert cancel_res["success"] is True


@pytest.mark.asyncio
async def test_multi_turn_llm_appointment_booking_flow():
    db = MockDbForTools(connected=True)

    # Turn 1: User expresses intent to book without info
    events_t1 = []
    async for event in RAGService.handle_message_stream(
        db=db,
        conversation=mock_conversation,
        chatbot=mock_chatbot,
        user_message="I want to book an appointment.",
        llm_provider=MockLLMProvider()
    ):
        events_t1.append(event)
    
    deltas_t1 = "".join([e["data"] for e in events_t1 if e["event"] == "delta"])
    assert "preferred date" in deltas_t1.lower() or "book" in deltas_t1.lower()

    # Turn 2: User asks for available times on date
    events_t2 = []
    async for event in RAGService.handle_message_stream(
        db=db,
        conversation=mock_conversation,
        chatbot=mock_chatbot,
        user_message="What available slots do you have on 2026-09-20?",
        llm_provider=MockLLMProvider()
    ):
        events_t2.append(event)
    
    types_t2 = [e["event"] for e in events_t2]
    assert "calendar_availability" in types_t2

    # Turn 3: User confirms slot with name and email
    events_t3 = []
    async for event in RAGService.handle_message_stream(
        db=db,
        conversation=mock_conversation,
        chatbot=mock_chatbot,
        user_message="Please book appointment for Jane Doe at jane@example.com for 2:00 PM on 2026-09-20",
        llm_provider=MockLLMProvider()
    ):
        events_t3.append(event)

    types_t3 = [e["event"] for e in events_t3]
    assert "appointment_booked" in types_t3
    booked_data = next(e["data"] for e in events_t3 if e["event"] == "appointment_booked")
    assert booked_data["attendee_name"] == "Jane Doe"
    assert booked_data["attendee_email"] == "jane@example.com"
    assert booked_data["meeting_link"].startswith("https://meet.google.com/")


@pytest.mark.asyncio
async def test_appointment_booking_disconnected_calendar():
    # When Google Calendar is not connected, tool execution must cleanly fail
    db = MockDbForTools(connected=False)
    res = await CalendarToolsExecutor.execute_tool(
        tool_name="create_calendar_event",
        arguments={
            "attendee_name": "Ghost User",
            "attendee_email": "ghost@example.com",
            "start_time": "2026-09-20T14:00:00Z"
        },
        db=db,
        organization_id=mock_org_id
    )
    assert res["success"] is False
    assert "not connected" in res["error"].lower() or "not active" in res["error"].lower()
    # Ensure no appointment was saved in database
    assert len([e for e in db.added_entities if isinstance(e, Appointment)]) == 0


@pytest.mark.asyncio
async def test_token_auto_refresh_on_expiration():
    # Expired token (stored 2 hours ago)
    old_integration = TenantIntegration(
        id=uuid.uuid4(),
        organization_id=mock_org_id,
        provider="google_calendar",
        encrypted_credentials=encrypt_vault_secret('{"access_token": "ya29.old_token", "refresh_token": "1//mock_refresh", "stored_at": 1000, "expires_in": 3600}'),
        status="connected",
        metadata_json={"account_email": "user@org.com"}
    )
    db = MockDbForTools(connected=True, integration=old_integration)

    token, err = await IntegrationService.get_valid_access_token(db, mock_org_id, "google_calendar")
    assert err is None
    assert token is not None
    assert token.startswith("ya29.mock_refreshed_token_")
