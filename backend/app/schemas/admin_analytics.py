from pydantic import BaseModel, field_validator
from typing import List
from datetime import datetime, date
from decimal import Decimal
import enum

class AnalyticsInterval(str, enum.Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

class AnalyticsTimeseriesPoint(BaseModel):
    date: str  # ISO format string for the bucket, e.g. YYYY-MM-DD
    new_users: int
    new_organizations: int
    new_conversations: int
    ai_cost_usd: Decimal

class AdminAnalyticsResponse(BaseModel):
    interval: AnalyticsInterval
    data: List[AnalyticsTimeseriesPoint]
