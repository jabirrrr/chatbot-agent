import uuid
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import RedirectResponse, HTMLResponse
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
    return_url: Optional[str] = Query(None, description="Frontend base URL to return to"),
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
            "type": "google_oauth_state",
            "return_url": return_url or settings.FRONTEND_URL.rstrip("/")
        }
    )
    auth_url = GoogleCalendarService.get_authorization_url(state=state_token)
    return AuthUrlResponse(auth_url=auth_url, provider="google_calendar")


@router.get("/google-calendar/dev-picker", response_class=HTMLResponse, summary="Development Google Account Picker")
async def google_dev_account_picker(
    state: str = Query(..., description="Signed OAuth state JWT"),
    redirect_uri: Optional[str] = Query(None, description="Callback redirect URI")
):
    """
    Renders a simulated Google Account Picker for development and demo environments.
    Allows selecting a test Google account or typing a custom email to complete the OAuth 2.0 flow.
    """
    cb_url = redirect_uri or settings.GOOGLE_REDIRECT_URI
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with Google - Choose an account</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }}
    .card {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      box-sizing: border-box;
    }}
    .google-logo {{
      width: 32px;
      height: 32px;
      margin-bottom: 20px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 6px 0;
    }}
    .subtitle {{
      font-size: 14px;
      color: #64748b;
      margin: 0 0 20px 0;
    }}
    .account-item {{
      display: flex;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 10px;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;
      cursor: pointer;
    }}
    .account-item:hover {{
      background: #f1f5f9;
      border-color: #cbd5e1;
    }}
    .avatar {{
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 15px;
      margin-right: 14px;
      flex-shrink: 0;
    }}
    .avatar.green {{ background: #059669; }}
    .account-info {{
      flex: 1;
      min-width: 0;
    }}
    .account-name {{
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }}
    .account-email {{
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .divider {{
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
    }}
    .permissions {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 12px;
      color: #475569;
      margin-bottom: 20px;
      line-height: 1.5;
    }}
    .permissions ul {{
      margin: 6px 0 0 0;
      padding-left: 18px;
    }}
    .custom-input {{
      width: 100%;
      padding: 10px 12px;
      font-size: 13px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-sizing: border-box;
      margin-bottom: 12px;
      outline: none;
    }}
    .custom-input:focus {{
      border-color: #2563eb;
    }}
    .btn {{
      display: block;
      width: 100%;
      padding: 10px;
      background: #2563eb;
      color: white;
      font-weight: 500;
      font-size: 13px;
      text-align: center;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-sizing: border-box;
    }}
    .btn:hover {{
      background: #1d4ed8;
    }}
    .footer-note {{
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      margin-top: 20px;
    }}
  </style>
</head>
<body>
  <div class="card">
    <svg class="google-logo" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    <h1>Choose an account</h1>
    <p class="subtitle">to connect Google Calendar to <strong>Chatly</strong></p>

    <div class="permissions">
      <strong>Chatly will receive permissions to:</strong>
      <ul>
        <li>See, edit, share, and delete events on your Google Calendar</li>
        <li>View your primary Google Account email address</li>
      </ul>
    </div>

    <a class="account-item" href="{cb_url}?code=mock_code_operator@helio-demo.com&state={state}">
      <div class="avatar">O</div>
      <div class="account-info">
        <div class="account-name">Helio Operator</div>
        <div class="account-email">operator@helio-demo.com</div>
      </div>
    </a>

    <a class="account-item" href="{cb_url}?code=mock_code_sarah@northstarstudio.agency&state={state}">
      <div class="avatar green">S</div>
      <div class="account-info">
        <div class="account-name">Sarah Jenkins</div>
        <div class="account-email">sarah@northstarstudio.agency</div>
      </div>
    </a>

    <div class="divider"></div>

    <form onsubmit="event.preventDefault(); var email = document.getElementById('custom_email').value; if(email) window.location.href = '{cb_url}?code=mock_code_' + encodeURIComponent(email) + '&state={state}';">
      <input type="email" id="custom_email" class="custom-input" placeholder="Or enter another Google account email..." required />
      <button type="submit" class="btn">Connect Custom Account</button>
    </form>

    <div class="footer-note">
      OAuth 2.0 • Offline Access & Refresh Token Enabled
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html_content)


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
    # Validate state JWT
    payload = decode_token(state)
    
    # Safely extract return URL from token payload or default to settings
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    if payload and isinstance(payload, dict) and payload.get("return_url"):
        frontend_base = payload.get("return_url").rstrip("/")

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
