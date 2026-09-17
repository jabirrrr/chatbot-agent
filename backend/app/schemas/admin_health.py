from typing import Dict, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


ComponentStatus = Literal["healthy", "degraded", "down", "not_configured", "unknown"]
OverallStatus = Literal["healthy", "degraded", "down", "unknown"]


class AdminComponentHealth(BaseModel):
    name: str
    status: ComponentStatus
    latency_ms: Optional[float] = None
    uptime: str = Field(default="No historical data", description="Truthful uptime indicator")
    details: Optional[str] = None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminErrorLog(BaseModel):
    id: str
    service: str
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    message: str
    time: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminHealthResponse(BaseModel):
    overall_status: OverallStatus
    checked_at: datetime
    components: Dict[str, AdminComponentHealth]
    recent_errors: List[AdminErrorLog] = Field(default_factory=list)
    has_persistent_error_telemetry: bool = Field(
        default=False, 
        description="Whether a persistent error log store (e.g. Sentry Events API or DB table) is active"
    )
    environment: str = "production"

    model_config = ConfigDict(from_attributes=True)
