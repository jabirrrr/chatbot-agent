import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.services.onboarding_service import OnboardingService
from app.services.email_service import EmailService
from app.schemas.onboarding import (
    OnboardingChecklistRead,
    OnboardingStepUpdate,
    EmailTriggerRequest
)

router = APIRouter()


@router.get("/checklist", response_model=OnboardingChecklistRead)
async def get_onboarding_checklist(
    db: AsyncSession = Depends(get_db),
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves current self-serve onboarding checklist and automatically verifies resource completion.
    Fulfills Phase 4 / Milestone M9 Deliverable 2.
    """
    checklist = await OnboardingService.refresh_from_resources(db, current_org.id)
    return OnboardingService.to_read_dto(checklist)


@router.post("/checklist/step", response_model=OnboardingChecklistRead)
async def update_onboarding_step(
    payload: OnboardingStepUpdate,
    db: AsyncSession = Depends(get_db),
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an onboarding checklist item (e.g. appearance_customized, widget_installed, calendar_connected).
    """
    checklist = await OnboardingService.update_step(
        db,
        current_org.id,
        payload.step_key,
        payload.completed
    )
    return OnboardingService.to_read_dto(checklist)


@router.post("/emails/trigger")
async def trigger_onboarding_email(
    payload: EmailTriggerRequest,
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user)
):
    """
    Manually triggers or simulates an onboarding email dispatch (Day 0, Day 1, Day 3, Day 7).
    """
    seq = payload.sequence_type
    email = payload.recipient_email
    org_name = current_org.name

    if seq == "day_0_welcome":
        res = await EmailService.send_welcome_email(email, current_user.full_name, org_name)
    elif seq == "day_1_knowledge":
        res = await EmailService.send_knowledge_upload_reminder(email, org_name)
    elif seq == "day_3_install":
        snippet = payload.metadata.get("snippet") if payload.metadata else None
        res = await EmailService.send_widget_installation_guide(email, org_name, snippet)
    elif seq == "day_7_lead":
        lead_name = payload.metadata.get("lead_name", "Alex Mercer") if payload.metadata else "Alex Mercer"
        lead_email = payload.metadata.get("lead_email", "alex@example.com") if payload.metadata else "alex@example.com"
        res = await EmailService.send_first_lead_notification(email, org_name, lead_name, lead_email)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown sequence_type: {seq}. Expected day_0_welcome, day_1_knowledge, day_3_install, or day_7_lead."
        )

    return {"status": "success", "dispatch": res}
