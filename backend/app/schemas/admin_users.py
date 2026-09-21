from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class AdminUserItem(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: datetime
    organization_count: int

    model_config = ConfigDict(from_attributes=True)

class AdminUsersResponse(BaseModel):
    items: List[AdminUserItem]
    total: int
    page: int
    size: int
    pages: int
