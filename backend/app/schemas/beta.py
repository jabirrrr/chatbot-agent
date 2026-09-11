from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class BetaFeedbackCreate(BaseModel):
    nps_score: int = Field(..., ge=1, le=10, description="NPS satisfaction score from 1 to 10")
    category: str = Field(default="general", description="Feedback domain area")
    feedback_text: str = Field(..., min_length=5, description="Qualitative feedback comments")
    feature_request: Optional[str] = Field(None, description="Requested enhancements")


class BetaFeedbackRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    nps_score: int
    category: str
    feedback_text: str
    feature_request: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class BetaTenantRead(BaseModel):
    name: str
    slug: str
    industry: str
    domain: str
    deployed: bool
    color: str


class BetaMetricsResponse(BaseModel):
    total_organizations: int
    deployed_count: int
    undeployed_count: int
    deployment_percentage: float
    exit_criteria_met: bool
    industry_distribution: Dict[str, int]
    average_nps_score: float
    system_uptime_percentage: float
    cross_tenant_leaks_detected: int
