import uuid
from datetime import datetime
import zoneinfo
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from app.models.organization_member import MemberRole


def validate_iana_timezone(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    cleaned = v.strip()
    # Normalize legacy display format if present, e.g. "America/Chicago (CST - UTC-6)" -> "America/Chicago"
    if " " in cleaned and "(" in cleaned:
        cleaned = cleaned.split(" ")[0].strip()
    try:
        zoneinfo.ZoneInfo(cleaned)
        return cleaned
    except Exception:
        raise ValueError(f"'{v}' is not a valid IANA timezone identifier (e.g. 'America/New_York', 'Asia/Kolkata', 'Europe/London')")


class OrgBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = "America/Chicago"

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        return validate_iana_timezone(v)


class OrgCreate(OrgBase):
    pass


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        return validate_iana_timezone(v)


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
