import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AIUsageBreakdownResponse,
    HeatmapResponse,
    ConversionFunnelResponse,
    KnowledgeGapsResponse
)
from app.services.analytics_service import AnalyticsService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/analytics", tags=["Analytics & Token Cost Accounting"])


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Executive overview metrics (REQ-ANALYTICS-01)"
)
async def get_overview(
    chatbot_id: Optional[uuid.UUID] = Query(None, description="Filter by chatbot"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns executive metrics: conversation volumes, lead conversion rate, and token totals.
    """
    return await AnalyticsService.get_overview(
        db=db,
        organization_id=org.id,
        chatbot_id=chatbot_id
    )


@router.get(
    "/usage",
    response_model=AIUsageBreakdownResponse,
    summary="AI usage & per-tenant token cost accounting (REQ-ANALYTICS-05)"
)
async def get_ai_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns per-model token consumption, prompt vs completion breakdown, and estimated cost in USD.
    """
    return await AnalyticsService.get_ai_usage_breakdown(
        db=db,
        organization_id=org.id
    )


@router.get(
    "/heatmaps",
    response_model=HeatmapResponse,
    summary="Conversation volume & activity heatmaps (REQ-ANALYTICS-02)"
)
async def get_heatmaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns a 7x24 density matrix of hourly conversation volume across weekdays.
    """
    return await AnalyticsService.get_heatmaps(
        db=db,
        organization_id=org.id
    )


@router.get(
    "/funnel",
    response_model=ConversionFunnelResponse,
    summary="Lead conversion funnels (REQ-ANALYTICS-03)"
)
async def get_conversion_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns visitor progression: Visitors -> Conversations -> Qualified Leads -> Booked Appointments.
    """
    return await AnalyticsService.get_conversion_funnel(
        db=db,
        organization_id=org.id
    )


@router.get(
    "/gaps",
    response_model=KnowledgeGapsResponse,
    summary="Unanswered question logs & knowledge gaps (REQ-ANALYTICS-04)"
)
async def get_knowledge_gaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns unanswered visitor queries and knowledge gaps to inform business FAQ updates.
    """
    return await AnalyticsService.get_knowledge_gaps(
        db=db,
        organization_id=org.id
    )
