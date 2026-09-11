import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, MemberRole
from app.schemas.organization import (
    OrgCreate,
    OrgUpdate,
    OrgRead,
    OrgMemberRead,
    OrgInviteCreate,
    OrgInviteRead
)
from app.services.org_service import OrganizationService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get(
    "/",
    response_model=List[OrgRead],
    summary="List all organizations the user belongs to"
)
async def list_user_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all organizations where the authenticated user holds an active membership.
    """
    orgs = await OrganizationService.get_user_organizations(db, current_user.id)
    return [OrgRead.model_validate(o) for o in orgs]


@router.post(
    "/",
    response_model=OrgRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new organization workspace"
)
async def create_organization(
    data: OrgCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Provisions a new tenant workspace and establishes the calling user as the OWNER.
    """
    org = await OrganizationService.create(db, current_user, data)
    return OrgRead.model_validate(org)


@router.get(
    "/{org_id}",
    response_model=OrgRead,
    summary="Get organization details"
)
async def get_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves tenant details, enforcing that the requesting user is a member.
    """
    membership = await OrganizationService.get_membership(db, org_id, current_user.id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this organization."
        )

    org = await OrganizationService.get_by_id(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )
    return OrgRead.model_validate(org)


@router.put(
    "/{org_id}",
    response_model=OrgRead,
    summary="Update organization settings"
)
async def update_organization(
    org_id: uuid.UUID,
    data: OrgUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates workspace metadata. Restricted to users with OWNER or ADMIN roles.
    """
    membership = await OrganizationService.get_membership(db, org_id, current_user.id)
    if not membership or membership.role not in [MemberRole.OWNER, MemberRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Only workspace owners or administrators can modify settings."
        )

    org = await OrganizationService.get_by_id(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    await db.commit()
    await db.refresh(org)
    return OrgRead.model_validate(org)


@router.get(
    "/{org_id}/members",
    response_model=List[OrgMemberRead],
    summary="List organization team members"
)
async def list_members(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all members and their assigned RBAC roles for a given organization.
    """
    membership = await OrganizationService.get_membership(db, org_id, current_user.id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view members of this organization."
        )

    stmt = (
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == org_id)
        .order_by(OrganizationMember.created_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    members = []
    for member, user in rows:
        members.append(
            OrgMemberRead(
                id=member.id,
                user_id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=member.role,
                created_at=member.created_at
            )
        )
    return members


@router.post(
    "/{org_id}/invite",
    response_model=OrgInviteRead,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a new member to the organization"
)
async def invite_member(
    org_id: uuid.UUID,
    data: OrgInviteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends an invitation with a unique token to join the organization workspace.
    Restricted to OWNER and ADMIN roles.
    """
    invitation = await OrganizationService.invite_member(
        db=db,
        org_id=org_id,
        inviter=current_user,
        data=data
    )
    return OrgInviteRead.model_validate(invitation)
