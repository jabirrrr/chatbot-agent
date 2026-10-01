import httpx
from typing import Dict, Any, List, Optional
import datetime

class CalComService:
    BASE_URL = "https://api.cal.com/v1"

    @staticmethod
    async def get_event_types(api_key: str) -> List[Dict[str, Any]]:
        """Fetch all event types for the given API key."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{CalComService.BASE_URL}/event-types",
                params={"apiKey": api_key}
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("event_types", [])

    @staticmethod
    async def get_default_event_type_id(api_key: str) -> Optional[int]:
        try:
            event_types = await CalComService.get_event_types(api_key)
            if event_types:
                return event_types[0].get("id")
            return None
        except Exception as e:
            print(f"Error fetching event types: {e}")
            return None

    @staticmethod
    async def get_availability(api_key: str, event_type_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch available slots. 
        start_date and end_date should be YYYY-MM-DD.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{CalComService.BASE_URL}/slots",
                params={
                    "apiKey": api_key,
                    "eventTypeId": event_type_id,
                    "startTime": start_date,
                    "endTime": end_date
                }
            )
            if resp.status_code != 200:
                print(f"Cal.com Error: {resp.text}")
                return []
                
            data = resp.json()
            slots = data.get("slots", {})
            available_slots = []
            
            # slots is usually a dict keyed by date, e.g., "2023-05-24": [{time: ...}, ...]
            for date_key, daily_slots in slots.items():
                for slot in daily_slots:
                    available_slots.append({
                        "start": slot.get("time"),
                        "attendees": slot.get("attendees", 0)
                    })
            return available_slots

    @staticmethod
    async def create_booking(api_key: str, event_type_id: int, name: str, email: str, start_time: str, timezone: str = "UTC") -> Dict[str, Any]:
        """
        Create a booking.
        start_time should be ISO 8601, e.g., 2023-05-24T13:00:00.000Z
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "eventTypeId": event_type_id,
                "start": start_time,
                "responses": {
                    "name": name,
                    "email": email
                },
                "metadata": {},
                "timeZone": timezone,
                "language": "en"
            }
            try:
                resp = await client.post(
                    f"{CalComService.BASE_URL}/bookings",
                    params={"apiKey": api_key},
                    json=payload
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("booking", {})
            except Exception as e:
                print(f"Error creating Cal.com booking: {e}")
                return {}

    @staticmethod
    async def cancel_booking(api_key: str, booking_uid: str, reason: str = "Cancelled by AI Assistant") -> bool:
        """
        Cancel a booking. booking_uid is returned when created.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{CalComService.BASE_URL}/bookings/{booking_uid}/cancel",
                params={"apiKey": api_key},
                json={"reason": reason}
            )
            return resp.status_code in [200, 201, 204]
