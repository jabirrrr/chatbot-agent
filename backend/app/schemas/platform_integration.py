from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class ProviderEnum(str, Enum):
    openrouter = "openrouter"
    openai = "openai"
    stripe = "stripe"

class PlatformIntegrationBase(BaseModel):
    name: str
    provider: ProviderEnum
    is_active: bool

class PlatformIntegrationCreate(PlatformIntegrationBase):
    credentials: str  # Plaintext key/secret provided by user

class PlatformIntegrationUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[ProviderEnum] = None
    is_active: Optional[bool] = None
    credentials: Optional[str] = None

class PlatformIntegrationResponse(PlatformIntegrationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
