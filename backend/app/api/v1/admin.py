from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.organization_member import MemberRole, OrganizationMember
from datetime import datetime, timezone
from app.core.config import settings
from app.schemas.admin_health import AdminHealthResponse, AdminComponentHealth
from app.services.admin_health_service import get_admin_health_telemetry, _sanitize_error_message

router = APIRouter()


from app.api.deps import require_system_owner
from app.models.user import User

@router.get("/health", response_model=AdminHealthResponse, tags=["Admin Health & Telemetry"])
async def get_admin_system_health(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> AdminHealthResponse:
    """
    Admin Console endpoint returning REAL infrastructure health telemetry.
    Strictly protected by require_system_owner: Requires authenticated platform Super Admin / System Owner.
    Ordinary organization admins (ADMIN role), members, and viewers are rejected with 403 Forbidden.
    Resilient: Handled exceptions return structured component health instead of crashing with HTTP 500.
    """
    try:
        return await get_admin_health_telemetry(db)
    except Exception as exc:
        now = datetime.now(timezone.utc)
        sanitized = _sanitize_error_message(str(exc))
        components = {
            "api": AdminComponentHealth(
                name="API / Application",
                status="healthy",
                latency_ms=0.0,
                uptime="No historical data",
                details=f"FastAPI runtime responsive on {settings.ENVIRONMENT} environment.",
                checked_at=now
            ),
            "database": AdminComponentHealth(
                name="Main Database (PostgreSQL)",
                status="down",
                latency_ms=None,
                uptime="No historical data",
                details=f"Database query failed: {sanitized}",
                checked_at=now
            ),
            "redis": AdminComponentHealth(
                name="Redis Cache",
                status="not_configured",
                latency_ms=None,
                uptime="No historical data",
                details="Redis cache is not configured for this deployment.",
                checked_at=now
            ),
            "workers": AdminComponentHealth(
                name="Background Workers",
                status="not_configured",
                latency_ms=None,
                uptime="No historical data",
                details="No persistent background worker is configured for this deployment.",
                checked_at=now
            ),
        }
        return AdminHealthResponse(
            overall_status="down",
            checked_at=now,
            components=components,
            recent_errors=[],
            has_persistent_error_telemetry=False,
            environment=settings.ENVIRONMENT
        )
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.schemas.admin_overview import AdminOverviewResponse
from app.schemas.admin_users import AdminUsersResponse
from app.schemas.admin_analytics import AdminAnalyticsResponse, AnalyticsInterval
from app.services.admin_service import get_overview_metrics, get_users_paginated, get_analytics_timeseries

@router.get("/overview", response_model=AdminOverviewResponse, tags=["Admin Overview"])
async def get_admin_overview(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> AdminOverviewResponse:
    """
    Returns platform-wide metrics for the Admin Console overview dashboard.
    Requires System Owner privileges.
    """
    return await get_overview_metrics(db)

@router.get("/users", response_model=AdminUsersResponse, tags=["Admin Users"])
async def get_admin_users(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> AdminUsersResponse:
    """
    Returns a paginated list of all users across the platform, with search capabilities.
    Requires System Owner privileges.
    """
    return await get_users_paginated(db, page, size, search)

@router.get("/analytics/timeseries", response_model=AdminAnalyticsResponse, tags=["Admin Analytics"])
async def get_admin_analytics_timeseries(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    interval: AnalyticsInterval = AnalyticsInterval.DAY,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> AdminAnalyticsResponse:
    """
    Returns time-series analytics for new users, organizations, conversations, and AI cost.
    Requires System Owner privileges.
    """
    # Default to last 30 days if not provided
    if not end_date:
        end_date = datetime.now(timezone.utc)
    if not start_date:
        start_date = end_date - timedelta(days=30)
        
    # Ensure they have timezone info
    if not start_date.tzinfo:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if not end_date.tzinfo:
        end_date = end_date.replace(tzinfo=timezone.utc)

    return await get_analytics_timeseries(db, start_date, end_date, interval)

from app.schemas.platform_setting import PlatformSettingResponse, PlatformSettingUpdate
from app.services.platform_setting_service import get_platform_settings, update_platform_settings

@router.get("/settings", response_model=PlatformSettingResponse, tags=["Admin Settings"])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> PlatformSettingResponse:
    """
    Returns global platform settings.
    Requires System Owner privileges.
    """
    return await get_platform_settings(db)

@router.put("/settings", response_model=PlatformSettingResponse, tags=["Admin Settings"])
async def update_settings(
    settings_in: PlatformSettingUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
) -> PlatformSettingResponse:
    return await update_platform_settings(db, settings_in)

from typing import List
from app.schemas.platform_integration import (
    PlatformIntegrationResponse,
    PlatformIntegrationCreate,
    PlatformIntegrationUpdate,
    ProviderEnum
)
from app.services.platform_integration_service import (
    get_integrations,
    create_integration,
    update_integration_by_provider,
    delete_integration_by_provider
)

@router.get("/integrations", response_model=List[PlatformIntegrationResponse], tags=["Admin Integrations"])
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
):
    """
    Returns all global platform integrations.
    """
    return await get_integrations(db)

@router.post("/integrations", response_model=PlatformIntegrationResponse, status_code=status.HTTP_201_CREATED, tags=["Admin Integrations"])
async def add_integration(
    integration_in: PlatformIntegrationCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
):
    """
    Adds a new global platform integration.
    """
    return await create_integration(db, integration_in)

@router.put("/integrations/{provider}", response_model=PlatformIntegrationResponse, tags=["Admin Integrations"])
async def edit_integration(
    provider: ProviderEnum,
    integration_in: PlatformIntegrationUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
):
    """
    Updates a global platform integration.
    """
    return await update_integration_by_provider(db, provider.value, integration_in)

@router.delete("/integrations/{provider}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin Integrations"])
async def remove_integration(
    provider: ProviderEnum,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_owner)
):
    """
    Deletes a global platform integration.
    """
    await delete_integration_by_provider(db, provider.value)
