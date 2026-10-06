import uuid
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

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

@router.get("/google/auth-url", response_model=AuthUrlResponse, summary="Get Google OAuth URL")
async def get_google_auth_url(
    state: str = Query(..., description="State parameter for OAuth"),
):
    from app.adapters.calendar.google_calendar import GoogleCalendarService
    url = GoogleCalendarService.get_authorization_url(state)
    return AuthUrlResponse(auth_url=url, provider="google")

class GoogleCodeExchangeRequest(BaseModel):
    code: str

@router.post("/google/exchange", summary="Exchange Google Auth Code")
async def exchange_google_code(
    data: GoogleCodeExchangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    try:
        tokens = await GoogleCalendarService.exchange_code(data.code)
        # Note: integration_service.save_integration automatically handles VAULT_SECRET_KEY encryption
        await IntegrationService.save_integration(
            db=db,
            organization_id=org.id,
            provider="google_calendar",
            credentials={"refresh_token": tokens.get("refresh_token")},
            metadata={"account_email": tokens.get("account_email")}
        )
        return {"success": True, "provider": "google_calendar"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/google/disconnect", response_model=DisconnectResponse, summary="Disconnect Google Calendar")
async def disconnect_google(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    await IntegrationService.disconnect_integration(db=db, organization_id=org.id, provider="google_calendar")
    return DisconnectResponse(
        success=True,
        provider="google_calendar",
        message="Google Calendar integration disconnected successfully."
    )


@router.post("/calcom/disconnect", response_model=DisconnectResponse, summary="Disconnect Cal.com")
async def disconnect_calcom(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Deletes Cal.com connection for active tenant organization.
    """
    await IntegrationService.disconnect_integration(db=db, organization_id=org.id, provider="calcom")
    return DisconnectResponse(
        success=True,
        provider="calcom",
        message="Cal.com integration disconnected successfully."
    )


class CalcomIntegrationRequest(BaseModel):
    api_key: str
    event_type_id: Optional[int] = None

@router.post("/calcom", summary="Connect Cal.com integration")
async def connect_calcom(
    data: CalcomIntegrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    from app.adapters.calendar.calcom import CalComService
    try:
        # If event type ID not provided, try to fetch the default one
        if not data.event_type_id:
            data.event_type_id = await CalComService.get_default_event_type_id(data.api_key)
        
        if not data.event_type_id:
            raise HTTPException(status_code=400, detail="Could not find any event types for this Cal.com API key.")
            
        await IntegrationService.save_integration(
            db=db,
            organization_id=org.id,
            provider="calcom",
            credentials={"api_key": data.api_key},
            metadata={"event_type_id": data.event_type_id}
        )
        return {"success": True, "provider": "calcom", "message": "Cal.com connected successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/calcom/settings", summary="Update Cal.com Settings")
async def update_calcom_settings(
    settings: CalcomIntegrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    from app.adapters.calendar.calcom import CalComService
    if not settings.event_type_id:
        settings.event_type_id = await CalComService.get_default_event_type_id(settings.api_key)
        
    await IntegrationService.save_integration(
        db=db,
        organization_id=org.id,
        provider="calcom",
        credentials={"api_key": settings.api_key},
        metadata={"event_type_id": settings.event_type_id}
    )
    return {"success": True}


@router.get("/calendar/availability", summary="Get calendar availability slots")
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


@router.post("/calendar/events", summary="Create calendar booking event")
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


@router.get("/calendar/events/{event_id}", summary="Get calendar event details")
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


@router.patch("/calendar/events/{event_id}", summary="Update calendar event")
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


@router.delete("/calendar/events/{event_id}", summary="Delete calendar event")
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
