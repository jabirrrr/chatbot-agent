import pytest
from datetime import datetime, timezone
from app.adapters.calendar.provider import MockCalendarAdapter


@pytest.mark.asyncio
async def test_mock_calendar_slots_generation():
    adapter = MockCalendarAdapter()
    target = datetime(2026, 9, 15, 0, 0, 0, tzinfo=timezone.utc)
    slots = await adapter.get_available_slots(target)
    assert len(slots) == 4
    assert slots[0].label == "10:00 AM - 10:30 AM"
    assert slots[2].label == "2:00 PM - 2:30 PM"


@pytest.mark.asyncio
async def test_mock_calendar_successful_booking():
    adapter = MockCalendarAdapter()
    start_time = datetime(2026, 9, 15, 14, 0, 0, tzinfo=timezone.utc)
    result = await adapter.create_booking(
        start_time=start_time,
        duration_minutes=30,
        attendee_name="Dr. Marcus Vance",
        attendee_email="marcus@healthcorp.com"
    )
    assert result.success is True
    assert result.event_id is not None
    assert "gcal_mock_" in result.event_id
    assert "meet.google.com" in result.meeting_link


@pytest.mark.asyncio
async def test_mock_calendar_failure_and_graceful_degradation():
    # REQ-APPT-04: Graceful degradation when calendar provider encounters error
    failing_adapter = MockCalendarAdapter(simulate_failure=True)
    target = datetime(2026, 9, 15, 0, 0, 0, tzinfo=timezone.utc)

    # Returns empty slots without throwing unhandled exception
    slots = await failing_adapter.get_available_slots(target)
    assert slots == []

    # Booking returns structured failure with friendly error message
    result = await failing_adapter.create_booking(
        start_time=target,
        duration_minutes=30,
        attendee_name="Fallback User",
        attendee_email="fallback@example.com"
    )
    assert result.success is False
    assert "temporarily unreachable" in result.error_message
