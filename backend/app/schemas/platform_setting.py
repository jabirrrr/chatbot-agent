from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class PlatformSettingBase(BaseModel):
    allow_signups: bool
    max_tenants_allowed: Optional[int] = Field(default=None, ge=0)
    maintenance_mode: bool
    maintenance_message: str

class PlatformSettingUpdate(BaseModel):
    allow_signups: Optional[bool] = None
    max_tenants_allowed: Optional[int] = Field(default=None, ge=0)
    maintenance_mode: Optional[bool] = None
    maintenance_message: Optional[str] = None

class PlatformSettingResponse(PlatformSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
