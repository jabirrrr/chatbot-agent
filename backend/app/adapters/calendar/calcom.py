import httpx
from typing import Dict, Any, List, Optional
import datetime

class CalComService:
    BASE_URL = "https://api.cal.com/v2"

    @staticmethod
    def _get_headers(api_key: str, api_version: str = "2024-08-14") -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {api_key}",
            "cal-api-version": api_version,
            "Content-Type": "application/json"
        }

    @staticmethod
    async def get_event_types(api_key: str) -> List[Dict[str, Any]]:
        """Fetch all event types for the given API key."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{CalComService.BASE_URL}/event-types",
                headers=CalComService._get_headers(api_key, "2024-08-14")
            )
            if resp.status_code != 200:
                print(f"Cal.com Error get_event_types: {resp.text}")
                return []
            data = resp.json()
            # Extract eventTypes from eventTypeGroups
            res_data = data.get("data", {})
            if isinstance(res_data, dict) and "eventTypeGroups" in res_data:
                all_events = []
                for group in res_data.get("eventTypeGroups", []):
                    all_events.extend(group.get("eventTypes", []))
                return all_events
            return res_data if isinstance(res_data, list) else []

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
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{CalComService.BASE_URL}/slots",
                headers=CalComService._get_headers(api_key, "2024-09-04"),
                params={
                    "eventTypeId": event_type_id,
                    "start": start_date,
                    "end": end_date
                }
            )
            if resp.status_code != 200:
                print(f"Cal.com Error get_availability: {resp.text}")
                return []
                
            data = resp.json()
            # v2 returns slots inside `data.slots` or just `data` depending on the wrapper, we handle both safely
            slots_data = data.get("data", {}).get("slots", {}) if isinstance(data.get("data"), dict) and "slots" in data.get("data", {}) else data.get("data", {})
            
            available_slots = []
            
            # slots_data is usually a dict keyed by date, e.g., "2023-05-24": [{time: ...}, ...]
            if isinstance(slots_data, dict):
                for date_key, daily_slots in slots_data.items():
                    for slot in daily_slots:
                        slot_time = slot.get("start") or slot.get("time")
                        if slot_time:
                            available_slots.append({
                                "start": slot_time,
                                "attendees": slot.get("attendees", 0)
                            })
            return available_slots

    @staticmethod
    async def create_booking(api_key: str, event_type_id: int, name: str, email: str, start_time: str, timezone: str = "UTC") -> Dict[str, Any]:
        """
        Create a booking.
        start_time should be ISO 8601 UTC, e.g., 2023-05-24T13:00:00.000Z
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "eventTypeId": int(event_type_id),
                "start": start_time.replace("+00:00", "Z"),
                "responses": {
                    "name": name,
                    "email": email
                },
                "metadata": {},
                "timeZone": timezone,
                "language": "en"
            }
            print(f"[DEBUG] create_booking payload: {payload}")
            try:
                resp = await client.post(
                    f"{CalComService.BASE_URL}/bookings",
                    headers=CalComService._get_headers(api_key),
                    json=payload
                )
                if resp.status_code not in [200, 201]:
                    print(f"Cal.com Error create_booking: {resp.text}")
                    return {}
                data = resp.json()
                # v2 usually wraps response in `data`
                return data.get("data", {})
            except Exception as e:
                print(f"Error creating Cal.com booking: {repr(e)}")
                return {}

    @staticmethod
    async def cancel_booking(api_key: str, booking_uid: str, reason: str = "Cancelled by AI Assistant") -> bool:
        """
        Cancel a booking. booking_uid is returned when created.
        v2 endpoint: POST /v2/bookings/:bookingUid/cancel
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{CalComService.BASE_URL}/bookings/{booking_uid}/cancel",
                headers=CalComService._get_headers(api_key),
                json={"cancellationReason": reason}
            )
            if resp.status_code not in [200, 201, 204]:
                print(f"Cal.com Error cancel_booking: {resp.text}")
                return False
            return True

    @staticmethod
    async def reschedule_booking(api_key: str, booking_uid: str, new_start_time: str) -> Dict[str, Any]:
        """
        Reschedule a booking.
        v2 endpoint: POST /v2/bookings/:bookingUid/reschedule
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "start": new_start_time.replace("+00:00", "Z")
            }
            resp = await client.post(
                f"{CalComService.BASE_URL}/bookings/{booking_uid}/reschedule",
                headers=CalComService._get_headers(api_key, "2024-08-13"),
                json=payload
            )
            if resp.status_code not in [200, 201]:
                print(f"Cal.com Error reschedule_booking: {resp.text}")
                return {}
            data = resp.json()
            return data.get("data", {})
