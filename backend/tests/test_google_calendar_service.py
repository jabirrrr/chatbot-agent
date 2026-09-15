import pytest
from datetime import datetime, timezone, timedelta
from app.adapters.calendar.google_calendar import GoogleCalendarService


@pytest.mark.asyncio
async def test_google_calendar_auth_url():
    state = "test_signed_state_token_123"
    auth_url = GoogleCalendarService.get_authorization_url(state=state)
    assert "https://accounts.google.com/o/oauth2/v2/auth" in auth_url
    assert "state=test_signed_state_token_123" in auth_url
    assert "calendar.events" in auth_url
    assert "access_type=offline" in auth_url


@pytest.mark.asyncio
async def test_google_calendar_exchange_code():
    code = "mock_auth_code_xyz"
    token_data = await GoogleCalendarService.exchange_code(code)
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "Bearer"
    assert token_data.get("account_email") is not None


@pytest.mark.asyncio
async def test_google_calendar_token_refresh():
    refresh_token = "1//mock_refresh_token_abc"
    refreshed = await GoogleCalendarService.refresh_access_token(refresh_token)
    assert "access_token" in refreshed
    assert "ya29.mock_" in refreshed["access_token"]


@pytest.mark.asyncio
async def test_google_calendar_availability_calculation():
    token = "ya29.mock_test_token"
    target_date = datetime(2026, 9, 20, 0, 0, 0, tzinfo=timezone.utc)
    slots = await GoogleCalendarService.get_calendar_availability(token, target_date, duration_minutes=30)
    assert len(slots) > 0
    assert slots[0].label == "10:00 AM - 10:30 AM"
    assert slots[0].start_time.tzinfo is not None


@pytest.mark.asyncio
async def test_google_calendar_create_and_manage_event():
    token = "ya29.mock_test_token"
    start_time = datetime(2026, 9, 20, 14, 0, 0, tzinfo=timezone.utc)
    
    # 1. Create event
    booking = await GoogleCalendarService.create_calendar_event(
        access_token=token,
        start_time=start_time,
        duration_minutes=30,
        attendee_name="Alice Smith",
        attendee_email="alice@company.com",
        summary="Strategic Consultation",
        notes="Discussing enterprise deployment"
    )
    assert booking.success is True
    assert booking.event_id is not None
    assert booking.meeting_link is not None
    assert "meet.google.com" in booking.meeting_link

    # 2. Get event
    event = await GoogleCalendarService.get_calendar_event(token, booking.event_id)
    assert event is not None
    assert event.get("id") == booking.event_id

    # 3. Update event
    updated = await GoogleCalendarService.update_calendar_event(
        token,
        booking.event_id,
        {"summary": "Rescheduled Consultation"}
    )
    assert updated is not None
    assert updated.get("summary") == "Rescheduled Consultation"

    # 4. Cancel event
    cancelled = await GoogleCalendarService.cancel_calendar_event(token, booking.event_id)
    assert cancelled is True

    # 5. Revoke token
    revoked = await GoogleCalendarService.revoke_token(token)
    assert revoked is True
