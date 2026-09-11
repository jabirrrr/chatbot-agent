from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RevenueTierItem(BaseModel):
    tier: str
    count: int
    monthly_price_usd: float
    subtotal_mrr_usd: float


class FinancialMetricsResponse(BaseModel):
    mrr_usd: float
    arr_usd: float
    active_subscriptions: int
    trialing_subscriptions: int
    cancelled_subscriptions: int
    total_subscriptions: int
    churn_rate_pct: float
    churn_target_met: bool  # True if churn_rate_pct < 5.0%
    total_ai_cost_usd: float
    gross_profit_usd: float
    gross_margin_pct: float
    gross_margin_target_met: bool  # True if gross_margin_pct > 65.0%
    tier_breakdown: List[RevenueTierItem]
    currency: str = "USD"
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)
