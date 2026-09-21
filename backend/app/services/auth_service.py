import re
import uuid
from typing import Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, MemberRole
from app.schemas.auth import RegisterRequest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings


def slugify(text: str) -> str:
    """Converts a title/organization name into a clean URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text) or "workspace"


class AuthService:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def register(
        db: AsyncSession,
        req: RegisterRequest
    ) -> Tuple[User, Organization, str, str]:
        from app.services.platform_setting_service import get_platform_settings
        from sqlalchemy import func
        settings = await get_platform_settings(db)
        if not settings.allow_signups:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="New account signups are currently disabled."
            )
            
        # Check max tenants allowed
        orgs_res = await db.execute(select(func.count()).select_from(Organization))
        total_orgs = orgs_res.scalar() or 0
        if total_orgs >= settings.max_tenants_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maximum number of tenant organizations has been reached."
            )

        normalized_email = req.email.lower().strip()
        existing = await AuthService.get_by_email(db, normalized_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        # 1. Create User with Argon2id hash
        user = User(
            email=normalized_email,
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        await db.flush()

        # 2. Create Initial Workspace / Organization
        org_name = req.organization_name or (f"{req.full_name}'s Team" if req.full_name else "My Workspace")
        base_slug = slugify(org_name)
        slug = f"{base_slug}-{str(uuid.uuid4())[:6]}"

        org = Organization(
            name=org_name,
            slug=slug,
            subscription_status="free"
        )
        db.add(org)
        await db.flush()

        # 3. Add User as Organization OWNER
        membership = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            role=MemberRole.OWNER
        )
        db.add(membership)
        await db.flush()

        # 4. Generate Tokens
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"org_id": str(org.id), "role": MemberRole.OWNER.value}
        )
        refresh_token = create_refresh_token(subject=user.id)

        await db.commit()
        await db.refresh(user)
        await db.refresh(org)

        return user, org, access_token, refresh_token

    @staticmethod
    async def authenticate(
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        user = await AuthService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )
        return user

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession,
        refresh_token: str
    ) -> Tuple[str, str, User, List[Organization]]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )

        user_id_str = payload.get("sub")
        try:
            user_id = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token subject."
            )

        user = await AuthService.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists or is inactive."
            )

        # Retrieve user organizations
        stmt = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user.id)
        )
        result = await db.execute(stmt)
        orgs = list(result.scalars().all())

        primary_org_id = orgs[0].id if orgs else None
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"org_id": str(primary_org_id)} if primary_org_id else None
        )
        new_refresh_token = create_refresh_token(subject=user.id)

        return access_token, new_refresh_token, user, orgs
