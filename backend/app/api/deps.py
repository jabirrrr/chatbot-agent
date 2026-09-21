import uuid
from typing import AsyncGenerator, Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, MemberRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=True
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Extracts and validates the JWT Bearer token, resolving the authenticated User.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account removed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return user

oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)

async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        return await get_current_user(db=db, token=token)
    except HTTPException:
        return None

async def check_maintenance_mode(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Explicit Maintenance-Exempt Route Policy:
    Certain application routes must remain accessible even when the platform is under maintenance.
    - OAuth Callbacks: External providers (e.g., Google) redirect users back with authorization codes. If blocked by 503, the flow state is dropped and the connection fails.
    - Webhooks: Payment processors (e.g., Stripe) send asynchronous events. While Stripe retries 503s, exempting them ensures no delayed processing for critical billing events.
    - Note: System Owner Admin, Health, and Status routes are exempted because they do not have this dependency applied in the main router.
    """
    exempt_paths = [
        "/api/v1/integrations/google-calendar/callback",
        "/api/v1/integrations/google-calendar/auth-url",
        "/api/v1/integrations/google-calendar/dev-picker",
        "/api/v1/billing/webhook"
    ]
    
    if any(request.url.path == p or request.url.path.startswith(p + "/") for p in exempt_paths):
        return

    from app.services.platform_setting_service import get_platform_settings
    settings = await get_platform_settings(db)
    
    if settings.maintenance_mode:
        if not user or not user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=settings.maintenance_message
            )


async def get_current_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")
) -> Organization:
    """
    Resolves the active tenant context (Organization) for the authenticated user.
    Uses X-Organization-Id header if provided; falls back to the user's first organization.
    Ensures multi-tenant isolation by enforcing membership verification.
    """
    target_org_id: Optional[uuid.UUID] = None

    if x_organization_id:
        try:
            target_org_id = uuid.UUID(x_organization_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Organization-Id header format. Must be a valid UUID."
            )

    if target_org_id:
        # Verify user has membership in this organization
        stmt = (
            select(OrganizationMember)
            .where(
                OrganizationMember.organization_id == target_org_id,
                OrganizationMember.user_id == current_user.id
            )
        )
        result = await db.execute(stmt)
        membership = result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this organization or workspace."
            )
        org_stmt = select(Organization).where(Organization.id == target_org_id)
        org_res = await db.execute(org_stmt)
        org = org_res.scalar_one_or_none()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found."
            )
        return org

    # Fallback to user's first available organization
    stmt = (
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == current_user.id)
        .order_by(Organization.created_at.asc())
    )
    result = await db.execute(stmt)
    org = result.scalars().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No organization associated with this account."
        )
    return org


def require_role(allowed_roles: List[MemberRole]) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces minimum role privilege within the active organization context.
    """
    async def role_checker(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        org: Organization = Depends(get_current_organization)
    ) -> OrganizationMember:
        stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == current_user.id
        )
        result = await db.execute(stmt)
        member = result.scalar_one_or_none()

        if not member or member.role not in allowed_roles:
            role_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {', '.join(role_names)}."
            )
        return member

    return role_checker


async def require_system_owner(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Role-Based Access Control (RBAC) for Platform System Owners.
    Bypasses tenant boundaries; strictly requires the is_superuser flag.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires platform System Owner privileges."
        )
    return current_user
