import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.lead import LeadRead, LeadUpdate
from app.services.lead_service import LeadService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/leads", tags=["Leads CRM"])


class LeadListResponse(BaseModel):
    items: List[LeadRead]
    total: int


@router.get(
    "/export",
    summary="Export leads to CSV (REQ-LEAD-03)",
    response_class=PlainTextResponse
)
async def export_leads(
    chatbot_id: Optional[uuid.UUID] = Query(None, description="Filter by chatbot"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Exports all captured customer leads in RFC 4180 compliant CSV format.
    """
    csv_content = await LeadService.export_leads_csv(
        db=db,
        organization_id=org.id,
        chatbot_id=chatbot_id
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=leads_export_{org.id}.csv"
        }
    )


@router.get(
    "/",
    response_model=LeadListResponse,
    summary="List leads with search & status filters (REQ-LEAD-02)"
)
async def list_leads(
    chatbot_id: Optional[uuid.UUID] = Query(None, description="Filter by chatbot"),
    status: Optional[str] = Query(None, description="Filter by status: 'new', 'contacted', 'qualified', 'converted'"),
    search: Optional[str] = Query(None, description="Search by name, email, phone, or notes"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Retrieves a paged pipeline list of qualified prospect leads captured by the AI.
    """
    items, total = await LeadService.list_leads(
        db=db,
        organization_id=org.id,
        chatbot_id=chatbot_id,
        status=status,
        search=search,
        limit=limit,
        offset=offset
    )
    return LeadListResponse(
        items=[LeadRead.model_validate(l) for l in items],
        total=total
    )


@router.get(
    "/{lead_id}",
    response_model=LeadRead,
    summary="Get lead profile detail (REQ-LEAD-01)"
)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Retrieves full details and contact information for a captured lead.
    """
    lead = await LeadService.get_lead(
        db=db,
        organization_id=org.id,
        lead_id=lead_id
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    return LeadRead.model_validate(lead)


@router.patch(
    "/{lead_id}",
    response_model=LeadRead,
    summary="Update lead status or contact notes"
)
async def update_lead(
    lead_id: uuid.UUID,
    update_data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Updates lead qualification stage ('new' -> 'contacted' -> 'qualified' -> 'converted') and notes.
    """
    lead = await LeadService.update_lead(
        db=db,
        organization_id=org.id,
        lead_id=lead_id,
        update_data=update_data
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    return LeadRead.model_validate(lead)
