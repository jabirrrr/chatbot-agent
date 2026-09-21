from pydantic import BaseModel
from decimal import Decimal

class AdminOverviewResponse(BaseModel):
    total_organizations: int
    total_users: int
    total_conversations: int
    total_ai_cost_usd: Decimal
