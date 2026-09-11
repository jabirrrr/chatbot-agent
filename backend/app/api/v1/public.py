from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.organization import Organization
from app.models.api_key import ApiKey
from app.schemas.lead import LeadRead, LeadCreate
from app.schemas.conversation import ConversationRead
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.api_key_service import ApiKeyService
from app.services.lead_service import LeadService
from app.services.conversation_service import ConversationService
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/public", tags=["Public Developer REST API"])


async def get_api_key_tenant(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db)
) -> ApiKey:
    """
    Validates machine-to-machine API key using SHA-256 hash lookup.
    Fulfills REQ-INT-03.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header"
        )
    key_record = await ApiKeyService.verify_key(db, x_api_key)
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key"
        )
    return key_record


@router.get(
    "/leads",
    response_model=List[LeadRead],
    summary="Public API: List leads (REQ-INT-03)"
)
async def public_list_leads(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(get_api_key_tenant),
):
    items, _ = await LeadService.list_leads(
        db=db,
        organization_id=api_key.organization_id,
        limit=limit,
        offset=offset
    )
    return [LeadRead.model_validate(l) for l in items]


@router.post(
    "/leads",
    response_model=LeadRead,
    status_code=status.HTTP_201_CREATED,
    summary="Public API: Create lead (REQ-INT-03)"
)
async def public_create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(get_api_key_tenant),
):
    from app.models.lead import Lead
    lead = Lead(
        organization_id=api_key.organization_id,
        name=data.name,
        email=str(data.email) if data.email else None,
        phone=data.phone,
        notes=data.notes,
        status="new"
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return LeadRead.model_validate(lead)


@router.get(
    "/conversations",
    response_model=List[ConversationRead],
    summary="Public API: List conversations (REQ-INT-03)"
)
async def public_list_conversations(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(get_api_key_tenant),
):
    items, _ = await ConversationService.list_conversations(
        db=db,
        organization_id=api_key.organization_id,
        limit=limit,
        offset=offset
    )
    return [ConversationRead.model_validate(c) for c in items]


@router.get(
    "/analytics/summary",
    response_model=AnalyticsOverviewResponse,
    summary="Public API: Overview analytics (REQ-INT-03)"
)
async def public_analytics_summary(
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(get_api_key_tenant),
):
    return await AnalyticsService.get_overview(
        db=db,
        organization_id=api_key.organization_id
    )
