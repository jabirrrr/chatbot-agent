from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.organization_member import MemberRole, OrganizationMember
from app.schemas.admin_health import AdminHealthResponse
from app.services.admin_health_service import get_admin_health_telemetry

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
    """
    return await get_admin_health_telemetry(db)

