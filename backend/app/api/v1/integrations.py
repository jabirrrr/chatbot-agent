import uuid
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_token
from app.models.user import User
from app.models.organization import Organization
from app.api.deps import get_current_user, get_current_organization
from app.services.integration_service import IntegrationService
from app.services.calendar_tools import CalendarToolsExecutor
from app.adapters.calendar.google_calendar import GoogleCalendarService

router = APIRouter(prefix="/integrations", tags=["Integrations & OAuth"])


class IntegrationStatusResponse(BaseModel):
    integrations: Dict[str, Any]


class AuthUrlResponse(BaseModel):
    auth_url: str
    provider: str


class DisconnectResponse(BaseModel):
    success: bool
    provider: str
    message: str


class CreateEventRequest(BaseModel):
    attendee_name: str
    attendee_email: EmailStr
    start_time: str
    duration_minutes: int = 30
    summary: Optional[str] = None
    notes: Optional[str] = None


class UpdateEventRequest(BaseModel):
    summary: Optional[str] = None
    notes: Optional[str] = None
    start_time: Optional[str] = None
    duration_minutes: Optional[int] = None


@router.get("/status", response_model=IntegrationStatusResponse, summary="Get active integrations status")
async def get_integrations_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Returns real-time connection status for all third-party integrations (Google Calendar, etc.).
    """
    statuses = await IntegrationService.get_all_statuses(db=db, organization_id=org.id)
    return IntegrationStatusResponse(integrations=statuses)


@router.get("/google-calendar/auth-url", response_model=AuthUrlResponse, summary="Get Google Calendar OAuth Authorization URL")
async def get_google_auth_url(
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Generates a secure OAuth 2.0 authorization URL containing a signed CSRF/tenant state parameter.
    """
    state_token = create_access_token(
        subject=str(org.id),
        extra_claims={
            "org_id": str(org.id),
            "user_id": str(current_user.id),
            "oauth_flow": "google_calendar",
            "type": "google_oauth_state"
        }
    )
    auth_url = GoogleCalendarService.get_authorization_url(state=state_token)
    return AuthUrlResponse(auth_url=auth_url, provider="google_calendar")


@router.get("/google-calendar/callback", summary="Google OAuth 2.0 redirect callback endpoint")
async def google_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives authorization code from Google OAuth, validates signed state token,
    exchanges code for OAuth tokens, encrypts credentials, and redirects user back to dashboard.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")

    # Handle user cancellation or error from Google OAuth
    if error:
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error={error}",
            status_code=status.HTTP_302_FOUND
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error=missing_code_or_state",
            status_code=status.HTTP_302_FOUND
        )

    # Validate state JWT
    payload = decode_token(state)
    if not payload:
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error=invalid_state_token",
            status_code=status.HTTP_302_FOUND
        )

    org_id_str = payload.get("org_id") or payload.get("sub")
    if not org_id_str:
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error=invalid_organization",
            status_code=status.HTTP_302_FOUND
        )

    try:
        org_id = uuid.UUID(org_id_str)
    except (KeyError, ValueError):
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error=invalid_organization",
            status_code=status.HTTP_302_FOUND
        )

    # Exchange code for tokens
    try:
        token_data = await GoogleCalendarService.exchange_code(code)
        account_email = token_data.get("account_email")

        # Save encrypted credentials in vault
        await IntegrationService.save_integration(
            db=db,
            organization_id=org_id,
            provider="google_calendar",
            credentials=token_data,
            metadata={"account_email": account_email, "scopes": token_data.get("scope")}
        )

        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_success=true",
            status_code=status.HTTP_302_FOUND
        )
    except Exception as e:
        err_msg = str(e).replace("\n", " ")[:100]
        return RedirectResponse(
            url=f"{frontend_base}/?screen=integrations&gcal_error={err_msg}",
            status_code=status.HTTP_302_FOUND
        )


@router.post("/google-calendar/disconnect", response_model=DisconnectResponse, summary="Disconnect Google Calendar")
async def disconnect_google_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Revokes stored tokens and deletes Google Calendar connection for active tenant organization.
    """
    await IntegrationService.disconnect_integration(db=db, organization_id=org.id, provider="google_calendar")
    return DisconnectResponse(
        success=True,
        provider="google_calendar",
        message="Google Calendar integration disconnected successfully."
    )


@router.get("/google-calendar/availability", summary="Get calendar availability slots")
async def get_calendar_availability(
    target_date: str = Query(..., description="Target date formatted YYYY-MM-DD"),
    duration_minutes: int = Query(30, ge=15, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Returns available meeting slots on the tenant's connected Google Calendar.
    """
    result = await CalendarToolsExecutor.handle_get_availability(
        db=db,
        organization_id=org.id,
        args={"target_date": target_date, "duration_minutes": duration_minutes}
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to retrieve calendar availability")
        )
    return result


@router.post("/google-calendar/events", summary="Create calendar booking event")
async def create_calendar_event(
    data: CreateEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Creates an appointment directly in Google Calendar and records in tenant appointments.
    """
    result = await CalendarToolsExecutor.handle_create_event(
        db=db,
        organization_id=org.id,
        conversation_id=None,
        lead_id=None,
        args=data.model_dump()
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to book calendar event")
        )
    return result


@router.get("/google-calendar/events/{event_id}", summary="Get Google Calendar event details")
async def get_calendar_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Retrieves event information from Google Calendar.
    """
    result = await CalendarToolsExecutor.handle_get_event(
        db=db,
        organization_id=org.id,
        args={"event_id": event_id}
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Calendar event not found")
        )
    return result


@router.patch("/google-calendar/events/{event_id}", summary="Update Google Calendar event")
async def update_calendar_event(
    event_id: str,
    data: UpdateEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Updates or reschedules an event on Google Calendar.
    """
    args = {k: v for k, v in data.model_dump().items() if v is not None}
    args["event_id"] = event_id
    result = await CalendarToolsExecutor.handle_update_event(
        db=db,
        organization_id=org.id,
        args=args
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to update calendar event")
        )
    return result


@router.delete("/google-calendar/events/{event_id}", summary="Delete Google Calendar event")
async def delete_calendar_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Cancels an appointment from Google Calendar and marks status as cancelled in database.
    """
    result = await CalendarToolsExecutor.handle_cancel_event(
        db=db,
        organization_id=org.id,
        args={"event_id": event_id}
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to cancel calendar event")
        )
    return result
