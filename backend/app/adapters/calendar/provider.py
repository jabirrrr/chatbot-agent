import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import List, Optional


@dataclass
class CalendarSlot:
    start_time: datetime
    end_time: datetime
    label: str


@dataclass
class BookingResult:
    success: bool
    event_id: Optional[str] = None
    meeting_link: Optional[str] = None
    error_message: Optional[str] = None


class CalendarProvider(ABC):
    """
    Abstract interface for calendar scheduling providers (Google Calendar, Outlook, Mock).
    Fulfills REQ-APPT-01 and REQ-APPT-04.
    """

    @abstractmethod
    async def get_available_slots(self, target_date: datetime) -> List[CalendarSlot]:
        """
        Returns available meeting slots for the given calendar day.
        """
        pass

    @abstractmethod
    async def create_booking(
        self,
        start_time: datetime,
        duration_minutes: int,
        attendee_name: str,
        attendee_email: str,
        summary: Optional[str] = None
    ) -> BookingResult:
        """
        Reserves a calendar slot and creates a calendar event with meeting link.
        """
        pass


class MockCalendarAdapter(CalendarProvider):
    """
    In-memory and deterministic calendar provider for CI/CD, local testing, and fallback.
    Fulfills REQ-APPT-04 (graceful degradation when external API is offline or unconfigured).
    """

    def __init__(self, simulate_failure: bool = False):
        self.simulate_failure = simulate_failure

    async def get_available_slots(self, target_date: datetime) -> List[CalendarSlot]:
        if self.simulate_failure:
            # Graceful degradation returns empty list instead of crashing
            return []

        base = target_date.replace(hour=9, minute=0, second=0, microsecond=0)
        # Generate 4 slots across the business day
        slots = [
            CalendarSlot(
                start_time=base + timedelta(hours=1),
                end_time=base + timedelta(hours=1, minutes=30),
                label="10:00 AM - 10:30 AM"
            ),
            CalendarSlot(
                start_time=base + timedelta(hours=2, minutes=30),
                end_time=base + timedelta(hours=3),
                label="11:30 AM - 12:00 PM"
            ),
            CalendarSlot(
                start_time=base + timedelta(hours=5),
                end_time=base + timedelta(hours=5, minutes=30),
                label="2:00 PM - 2:30 PM"
            ),
            CalendarSlot(
                start_time=base + timedelta(hours=6, minutes=30),
                end_time=base + timedelta(hours=7),
                label="3:30 PM - 4:00 PM"
            ),
        ]
        return slots

    async def create_booking(
        self,
        start_time: datetime,
        duration_minutes: int,
        attendee_name: str,
        attendee_email: str,
        summary: Optional[str] = None
    ) -> BookingResult:
        if self.simulate_failure:
            return BookingResult(
                success=False,
                error_message="Calendar provider temporarily unreachable. Contacting human operator."
            )

        event_id = f"gcal_mock_{int(start_time.timestamp())}_{attendee_email.split('@')[0]}"
        meeting_link = f"https://meet.google.com/mock-{int(start_time.timestamp())}"
        return BookingResult(
            success=True,
            event_id=event_id,
            meeting_link=meeting_link
        )
