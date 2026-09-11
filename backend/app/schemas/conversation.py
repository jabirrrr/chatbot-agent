import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    content: str
    sender_type: str = "visitor"


class MessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    content: str
    tool_calls: Optional[Any] = None
    tokens_used: Optional[int] = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationSessionCreate(BaseModel):
    widget_token: str
    visitor_id: str


class ConversationSessionResponse(BaseModel):
    session_token: str
    conversation_id: uuid.UUID
    chatbot_name: str
    welcome_message: str
    theme_color: str
    messages: List[MessageRead]


class ChatMessageRequest(BaseModel):
    session_token: str
    message: str


class ConversationRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    chatbot_id: uuid.UUID
    visitor_id: str
    status: str
    summary: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationReadDetail(ConversationRead):
    messages: List[MessageRead] = []


class ConversationUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Status: 'active', 'closed', 'handed_off'")
    summary: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
