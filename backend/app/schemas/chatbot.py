import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ChatbotBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    system_prompt: Optional[str] = "You are a helpful, accurate, and polite customer support assistant for our business. If the user wants to book an appointment, ALWAYS ask for their name and email address first before fetching calendar availability or booking."
    welcome_message: Optional[str] = "Hi there! 👋 How can I help you today?"
    fallback_message: Optional[str] = "I'm sorry, I don't have that information. Would you like me to connect you with a team member?"
    model_name: Optional[str] = "anthropic/claude-sonnet-5"
    temperature: Optional[float] = 0.3
    max_tokens: Optional[float] = 1024
    theme_color: Optional[str] = "#3b82f6"
    position: Optional[str] = "bottom-right"
    lead_capture_enabled: Optional[bool] = True
    appointment_booking_enabled: Optional[bool] = True
    config_json: Optional[Dict[str, Any]] = {}


class ChatbotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = "You are a helpful, accurate, and polite customer support assistant for our business. If the user wants to book an appointment, ALWAYS ask for their name and email address first before fetching calendar availability or booking."
    welcome_message: Optional[str] = "Hi there! 👋 How can I help you today?"
    fallback_message: Optional[str] = "I'm sorry, I don't have that information. Would you like me to connect you with a team member?"
    model_name: Optional[str] = "anthropic/claude-sonnet-5"
    temperature: Optional[float] = 0.3
    theme_color: Optional[str] = "#3b82f6"
    position: Optional[str] = "bottom-right"
    lead_capture_enabled: Optional[bool] = True
    appointment_booking_enabled: Optional[bool] = True
    config_json: Optional[Dict[str, Any]] = {}


class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    system_prompt: Optional[str] = None
    welcome_message: Optional[str] = None
    fallback_message: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    theme_color: Optional[str] = None
    position: Optional[str] = None
    lead_capture_enabled: Optional[bool] = None
    appointment_booking_enabled: Optional[bool] = None
    config_json: Optional[Dict[str, Any]] = None


class ChatbotRead(ChatbotBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    widget_token: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicWidgetConfig(BaseModel):
    name: str
    welcome_message: str
    theme_color: str
    position: str
    lead_capture_enabled: bool
    appointment_booking_enabled: bool
    is_active: bool
    avatar_url: Optional[str] = None
    tone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChatbotPreviewRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []
    botConfig: Optional[Dict[str, Any]] = None
