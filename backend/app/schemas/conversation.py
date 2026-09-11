import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    content: str
    sender_type: str = "visitor"


class MessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    content: str
    tool_calls: Optional[Any] = None
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
