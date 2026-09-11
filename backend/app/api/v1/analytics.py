import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.analytics import AnalyticsOverviewResponse, AIUsageBreakdownResponse
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
