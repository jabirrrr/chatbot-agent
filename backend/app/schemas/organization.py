import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.organization_member import MemberRole


class OrgBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = "America/Chicago"


class OrgCreate(OrgBase):
    pass


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None


class OrgRead(OrgBase):
    id: uuid.UUID
    slug: str
    subscription_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrgMemberRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: MemberRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrgInviteCreate(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.MEMBER


class OrgInviteRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    email: EmailStr
    role: MemberRole
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
