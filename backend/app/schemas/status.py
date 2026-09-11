from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ComponentHealth(BaseModel):
    name: str
    status: str  # 'operational', 'degraded', 'outage'
    latency_ms: float
    description: str


class IncidentReport(BaseModel):
    id: str
    title: str
    status: str  # 'resolved', 'monitoring', 'investigating'
    impact: str  # 'none', 'minor', 'major'
    timestamp: datetime
    resolution_details: str


class SystemStatusResponse(BaseModel):
    overall_status: str  # 'all_systems_operational', 'partially_degraded', 'major_outage'
    uptime_percentage_90d: float  # e.g. 99.98
    components: List[ComponentHealth]
    active_incidents: List[IncidentReport]
    past_incidents: List[IncidentReport]
    sentry_monitoring_active: bool
    last_checked: datetime

    model_config = ConfigDict(from_attributes=True)
