import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, MemberRole
from app.models.invitation import Invitation
from app.models.user import User
from app.schemas.organization import OrgCreate, OrgInviteCreate


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text) or "workspace"


class OrganizationService:
    @staticmethod
    async def create(
        db: AsyncSession,
        creator: User,
        data: OrgCreate
    ) -> Organization:
        base_slug = slugify(data.name)
        slug = f"{base_slug}-{str(uuid.uuid4())[:6]}"

        org = Organization(
            name=data.name,
            slug=slug,
            website=data.website,
            industry=data.industry,
            timezone=data.timezone or "America/Chicago",
            subscription_status="free"
        )
        db.add(org)
        await db.flush()

        # Add Creator as OWNER
        member = OrganizationMember(
            organization_id=org.id,
            user_id=creator.id,
            role=MemberRole.OWNER
        )
        db.add(member)
        await db.commit()
        await db.refresh(org)
        return org

    @staticmethod
    async def get_by_id(db: AsyncSession, org_id: uuid.UUID) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.id == org_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_organizations(db: AsyncSession, user_id: uuid.UUID) -> List[Organization]:
        stmt = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(Organization.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_membership(
        db: AsyncSession,
        org_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[OrganizationMember]:
        stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def invite_member(
        db: AsyncSession,
        org_id: uuid.UUID,
        inviter: User,
        data: OrgInviteCreate
    ) -> Invitation:
        # Verify inviter is OWNER or ADMIN
        membership = await OrganizationService.get_membership(db, org_id, inviter.id)
        if not membership or membership.role not in [MemberRole.OWNER, MemberRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace owners or administrators can invite team members."
            )

        token = f"inv_{uuid.uuid4().hex}"
        invitation = Invitation(
            organization_id=org_id,
            email=data.email.lower().strip(),
            role=data.role,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)
        return invitation
