import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.appointment import AppointmentRead, AppointmentCreate
from app.services.appointment_service import AppointmentService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/appointments", tags=["Appointments & Scheduling"])


class AppointmentListResponse(BaseModel):
    items: List[AppointmentRead]
    total: int


@router.get(
    "/",
    response_model=AppointmentListResponse,
    summary="List appointments in dashboard (REQ-APPT-03)"
)
async def list_appointments(
    status: Optional[str] = Query(None, description="Filter by status: 'scheduled', 'completed', 'cancelled'"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns a paged list of scheduled appointments for the tenant organization.
    """
    items, total = await AppointmentService.list_appointments(
        db=db,
        organization_id=org.id,
        status=status,
        limit=limit,
        offset=offset
    )
    return AppointmentListResponse(
        items=[AppointmentRead.model_validate(a) for a in items],
        total=total
    )


@router.post(
    "/",
    response_model=AppointmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Book appointment with calendar sync (REQ-APPT-01, REQ-APPT-02)"
)
async def create_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Creates an appointment booking and syncs event with Google Calendar.
    """
    appt = await AppointmentService.create_appointment(
        db=db,
        organization_id=org.id,
        data=data
    )
    return AppointmentRead.model_validate(appt)


@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentRead,
    summary="Cancel scheduled appointment"
)
async def cancel_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Cancels an existing appointment.
    """
    appt = await AppointmentService.cancel_appointment(
        db=db,
        organization_id=org.id,
        appointment_id=appointment_id
    )
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return AppointmentRead.model_validate(appt)
