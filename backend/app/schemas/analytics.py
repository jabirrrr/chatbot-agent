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


class HeatmapCell(BaseModel):
    day_of_week: int  # 0 = Sunday, 6 = Saturday
    hour_of_day: int  # 0 to 23
    count: int


class HeatmapResponse(BaseModel):
    matrix: List[HeatmapCell]


class FunnelStage(BaseModel):
    stage_name: str
    count: int
    conversion_rate_pct: float


class ConversionFunnelResponse(BaseModel):
    stages: List[FunnelStage]
    overall_conversion_pct: float


class KnowledgeGapItem(BaseModel):
    question: str
    occurrences: int
    first_seen: datetime
    last_seen: datetime
    suggested_topic: str


class KnowledgeGapsResponse(BaseModel):
    gaps: List[KnowledgeGapItem]
    total_unanswered: int
