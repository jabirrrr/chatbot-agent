from datetime import date, datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class AnalyticsOverviewResponse(BaseModel):
    total_conversations: int
    active_conversations: int
    closed_conversations: int
    handed_off_conversations: int
    total_leads: int
    lead_conversion_rate_pct: float
    total_tokens_consumed: int
    estimated_total_cost_usd: float

    model_config = ConfigDict(from_attributes=True)


class ModelUsageItem(BaseModel):
    model: str
    provider: str
    total_requests: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class DailyUsageItem(BaseModel):
    date: str
    total_tokens: int
    total_cost_usd: float
    total_conversations: int


class AIUsageBreakdownResponse(BaseModel):
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    total_cost_usd: float
    models: List[ModelUsageItem]
    daily_trend: List[DailyUsageItem]

    model_config = ConfigDict(from_attributes=True)
