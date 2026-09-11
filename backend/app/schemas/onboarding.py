import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OnboardingChecklistRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    account_created: bool
    chatbot_configured: bool
    knowledge_uploaded: bool
    appearance_customized: bool
    widget_installed: bool
    calendar_connected: bool
    first_test_chat: bool
    completed_at: Optional[datetime] = None
    completion_percentage: float = 0.0
    completed_steps: int = 0
    total_steps: int = 7

    model_config = ConfigDict(from_attributes=True)


class OnboardingStepUpdate(BaseModel):
    step_key: str  # e.g. 'chatbot_configured', 'knowledge_uploaded', etc.
    completed: bool = True


class EmailTriggerRequest(BaseModel):
    sequence_type: str  # 'day_0_welcome', 'day_1_knowledge', 'day_3_install', 'day_7_lead'
    recipient_email: str
    metadata: Optional[dict] = None
