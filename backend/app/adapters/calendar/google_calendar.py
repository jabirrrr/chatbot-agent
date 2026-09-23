import json
import uuid
import httpx
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.adapters.calendar.provider import CalendarProvider, CalendarSlot, BookingResult


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"

SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]


class GoogleCalendarService:
    """
    Handles Google Calendar OAuth 2.0 token management, availability calculation,
    and event CRUD operations.
    """

    @staticmethod
    def get_authorization_url(state: str, redirect_uri: Optional[str] = None) -> str:
        """
        Builds Google OAuth 2.0 authorization URL with account chooser and offline access.
        """
        client_id = settings.GOOGLE_CLIENT_ID or "mock-google-client-id.apps.googleusercontent.com"
        r_uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
        scope_str = " ".join(SCOPES)

        params = {
            "client_id": client_id,
            "redirect_uri": r_uri,
            "response_type": "code",
            "scope": scope_str,
            "access_type": "offline",
            "prompt": "select_account",
            "include_granted_scopes": "true",
            "state": state
        }
        return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

    @staticmethod
    async def exchange_code(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
        """
        Exchanges authorization code for access and refresh tokens.
        """
        if (
            settings.ENVIRONMENT == "testing"
            or not settings.GOOGLE_CLIENT_SECRET
            or settings.GOOGLE_CLIENT_SECRET.startswith("mock-")
            or code.startswith("mock_")
        ):
            # Extract email if encoded in mock code (e.g., mock_code_user@example.com)
            account_email = "operator@helio-demo.com"
            if code.startswith("mock_code_") and len(code) > len("mock_code_"):
                extracted = code[len("mock_code_"):]
                if "@" in extracted:
                    account_email = extracted

            # Deterministic mock response for testing/offline environments
            return {
                "access_token": f"ya29.mock_access_token_{uuid.uuid4().hex[:8]}",
                "refresh_token": f"1//mock_refresh_token_{uuid.uuid4().hex[:12]}",
                "expires_in": 3599,
                "token_type": "Bearer",
                "scope": " ".join(SCOPES),
                "account_email": account_email
            }

        r_uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": r_uri
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=data)
            if resp.status_code != 200:
                raise ValueError(f"Failed to exchange Google OAuth code: {resp.text}")
            token_data = resp.json()

            # Attempt to fetch user's account email
            account_email = None
            if "access_token" in token_data:
                try:
                    userinfo_res = await client.get(
                        GOOGLE_USERINFO_URL,
                        headers={"Authorization": f"Bearer {token_data['access_token']}"}
                    )
                    if userinfo_res.status_code == 200:
                        account_email = userinfo_res.json().get("email")
                except Exception:
                    account_email = None

            token_data["account_email"] = account_email
            return token_data

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
        """
        Uses refresh_token to obtain fresh access token.
        """
        if (
            settings.ENVIRONMENT == "testing"
            or not settings.GOOGLE_CLIENT_SECRET
            or settings.GOOGLE_CLIENT_SECRET.startswith("mock-")
            or refresh_token.startswith("1//mock_")
        ):
            return {
                "access_token": f"ya29.mock_refreshed_token_{uuid.uuid4().hex[:8]}",
                "expires_in": 3599,
                "token_type": "Bearer"
            }

        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=data)
            if resp.status_code != 200:
                raise ValueError(f"Google token refresh failed: {resp.text}")
            return resp.json()

    @staticmethod
    async def revoke_token(token: str) -> bool:
        """
        Revokes an OAuth access or refresh token with Google.
        """
        if token.startswith("ya29.mock_") or token.startswith("1//mock_") or settings.ENVIRONMENT == "testing":
            return True

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(GOOGLE_REVOKE_URL, params={"token": token})
                return resp.status_code == 200
        except Exception:
            return False

    @staticmethod
    async def get_calendar_availability(
        access_token: str,
        target_date: datetime,
        duration_minutes: int = 30,
        business_start_str: str = "09:00",
        business_end_str: str = "17:00",
        business_days: Optional[List[int]] = None
    ) -> List[CalendarSlot]:
        """
        Queries free/busy information or events for the day and calculates available slots.
        """
        # Ensure UTC timezone
        if target_date.tzinfo is None:
            target_date = target_date.replace(tzinfo=timezone.utc)
            
        if business_days is not None and target_date.weekday() not in business_days:
            return []

        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=0)
        
        try:
            start_hour, start_min = map(int, business_start_str.split(":"))
            end_hour, end_min = map(int, business_end_str.split(":"))
        except (ValueError, AttributeError):
            start_hour, start_min = 9, 0
            end_hour, end_min = 17, 0

        # In testing or mock mode, generate standard business slots
        if access_token.startswith("ya29.mock_") or settings.ENVIRONMENT == "testing":
            base = start_of_day.replace(hour=start_hour, minute=start_min)
            return [
                CalendarSlot(
                    start_time=base + timedelta(hours=1),
                    end_time=base + timedelta(hours=1, minutes=duration_minutes),
                    label="10:00 AM - 10:30 AM"
                ),
                CalendarSlot(
                    start_time=base + timedelta(hours=2, minutes=30),
                    end_time=base + timedelta(hours=2, minutes=30 + duration_minutes),
                    label="11:30 AM - 12:00 PM"
                ),
            ]

        # Live Google Calendar freeBusy query
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                query_payload = {
                    "timeMin": start_of_day.isoformat(),
                    "timeMax": end_of_day.isoformat(),
                    "items": [{"id": "primary"}]
                }
                resp = await client.post(
                    f"{GOOGLE_CALENDAR_API_BASE}/freeBusy",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=query_payload
                )
                if resp.status_code != 200:
                    return []

                busy_periods = resp.json().get("calendars", {}).get("primary", {}).get("busy", [])

                business_start = start_of_day.replace(hour=start_hour, minute=start_min)
                business_end = start_of_day.replace(hour=end_hour, minute=end_min)

                available_slots: List[CalendarSlot] = []
                current = business_start

                while current + timedelta(minutes=duration_minutes) <= business_end:
                    slot_end = current + timedelta(minutes=duration_minutes)
                    
                    # Check collision with busy periods
                    is_busy = False
                    for b in busy_periods:
                        b_start = datetime.fromisoformat(b["start"].replace("Z", "+00:00"))
                        b_end = datetime.fromisoformat(b["end"].replace("Z", "+00:00"))
                        if max(current, b_start) < min(slot_end, b_end):
                            is_busy = True
                            break

                    if not is_busy:
                        label = f"{current.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
                        available_slots.append(CalendarSlot(
                            start_time=current,
                            end_time=slot_end,
                            label=label
                        ))
                    current += timedelta(minutes=30)

                return available_slots
        except Exception:
            return []

    @staticmethod
    async def create_calendar_event(
        access_token: str,
        start_time: datetime,
        duration_minutes: int,
        attendee_name: str,
        attendee_email: str,
        summary: Optional[str] = None,
        notes: Optional[str] = None
    ) -> BookingResult:
        """
        Creates an appointment event with Google Meet conferencing in the user's primary calendar.
        """
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        end_time = start_time + timedelta(minutes=duration_minutes)
        event_summary = summary or f"Consultation with {attendee_name}"
        event_description = notes or f"Booked via Helio AI Assistant for {attendee_name} ({attendee_email})"

        # Mock fallback for test environment
        if access_token.startswith("ya29.mock_") or settings.ENVIRONMENT == "testing":
            event_id = f"gcal_evt_{uuid.uuid4().hex[:12]}"
            meeting_link = f"https://meet.google.com/{uuid.uuid4().hex[:3]}-{uuid.uuid4().hex[:4]}-{uuid.uuid4().hex[:3]}"
            return BookingResult(
                success=True,
                event_id=event_id,
                meeting_link=meeting_link
            )

        payload = {
            "summary": event_summary,
            "description": event_description,
            "start": {"dateTime": start_time.isoformat()},
            "end": {"dateTime": end_time.isoformat()},
            "attendees": [{"email": attendee_email, "displayName": attendee_name}],
            "conferenceData": {
                "createRequest": {
                    "requestId": uuid.uuid4().hex,
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events",
                    params={"conferenceDataVersion": "1"},
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=payload
                )
                if resp.status_code not in (200, 201):
                    return BookingResult(
                        success=False,
                        error_message=f"Google Calendar event creation rejected: {resp.text}"
                    )

                res_json = resp.json()
                event_id = res_json.get("id")
                meeting_link = res_json.get("hangoutLink")
                if not meeting_link:
                    entry_points = res_json.get("conferenceData", {}).get("entryPoints", [])
                    if entry_points:
                        meeting_link = entry_points[0].get("uri")
                if not meeting_link:
                    meeting_link = res_json.get("htmlLink")

                return BookingResult(
                    success=True,
                    event_id=event_id,
                    meeting_link=meeting_link
                )
        except Exception as e:
            return BookingResult(
                success=False,
                error_message=f"Network or calendar exception: {str(e)}"
            )

    @staticmethod
    async def get_calendar_event(access_token: str, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches an existing calendar event from Google Calendar API.
        """
        if access_token.startswith("ya29.mock_") or settings.ENVIRONMENT == "testing":
            return {
                "id": event_id,
                "summary": "Consultation Session",
                "status": "confirmed",
                "start": {"dateTime": datetime.now(timezone.utc).isoformat()},
                "end": {"dateTime": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()},
                "hangoutLink": f"https://meet.google.com/mock-{event_id[:6]}"
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception:
            return None

    @staticmethod
    async def update_calendar_event(
        access_token: str,
        event_id: str,
        patch_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Updates an existing calendar event on Google Calendar.
        """
        if access_token.startswith("ya29.mock_") or settings.ENVIRONMENT == "testing":
            return {
                "id": event_id,
                "summary": patch_data.get("summary", "Updated Consultation"),
                "status": "confirmed",
                "updated": datetime.now(timezone.utc).isoformat()
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.patch(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=patch_data
                )
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception:
            return None

    @staticmethod
    async def cancel_calendar_event(access_token: str, event_id: str) -> bool:
        """
        Deletes a calendar event from Google Calendar.
        """
        if access_token.startswith("ya29.mock_") or settings.ENVIRONMENT == "testing":
            return True

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.delete(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                return resp.status_code in (200, 204)
        except Exception:
            return False
