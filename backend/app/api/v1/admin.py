from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.organization_member import MemberRole, OrganizationMember
from datetime import datetime, timezone
from app.core.config import settings
from app.schemas.admin_health import AdminHealthResponse, AdminComponentHealth
from app.services.admin_health_service import get_admin_health_telemetry, _sanitize_error_message

router = APIRouter()


@router.get("/health", response_model=AdminHealthResponse, tags=["Admin Health & Telemetry"])
async def get_admin_system_health(
    db: AsyncSession = Depends(get_db),
    admin_member: OrganizationMember = Depends(require_role([MemberRole.OWNER]))
) -> AdminHealthResponse:
    """
    Admin Console endpoint returning REAL infrastructure health telemetry.
    Strictly protected by existing RBAC authorization: Requires authenticated platform Super Admin / System Owner (OWNER role).
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


