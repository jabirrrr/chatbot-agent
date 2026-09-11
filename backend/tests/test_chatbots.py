import uuid
import pytest
from app.models.chatbot import Chatbot
from app.schemas.chatbot import ChatbotCreate, ChatbotUpdate, PublicWidgetConfig


def test_chatbot_model_instantiation():
    """Validates chatbot initialization with secure token and defaults."""
    org_id = uuid.uuid4()
    bot = Chatbot(
        organization_id=org_id,
        name="Support Assistant",
        description="Main customer service bot",
        system_prompt="You are a support bot.",
        welcome_message="Hello!",
        theme_color="#2563eb",
        widget_token="wgt_test_token_123",
        is_active=True
    )

    assert bot.name == "Support Assistant"
    assert bot.organization_id == org_id
    assert bot.is_active is True
    assert bot.widget_token.startswith("wgt_")
    assert bot.theme_color == "#2563eb"


def test_public_widget_config_schema():
    """Validates public embed configuration schema filtering."""
    org_id = uuid.uuid4()
    bot = Chatbot(
        organization_id=org_id,
        name="Storefront Concierge",
        welcome_message="Welcome to our store!",
        theme_color="#10b981",
        position="bottom-right",
        lead_capture_enabled=True,
        appointment_booking_enabled=False,
        is_active=True,
        widget_token="wgt_secure_token"
    )

    config = PublicWidgetConfig.model_validate(bot)
    assert config.name == "Storefront Concierge"
    assert config.theme_color == "#10b981"
    assert config.position == "bottom-right"
    assert config.lead_capture_enabled is True
    assert config.appointment_booking_enabled is False
    # Ensure system_prompt and internal tokens are not leaked in public config
    assert not hasattr(config, "system_prompt")
    assert not hasattr(config, "widget_token")


def test_chatbot_update_schema():
    """Validates partial updating of prompt and status switch."""
    update_data = ChatbotUpdate(
        name="Updated Bot Name",
        is_active=False,
        temperature=0.7
    )
    dumped = update_data.model_dump(exclude_unset=True)

    assert dumped["name"] == "Updated Bot Name"
    assert dumped["is_active"] is False
    assert dumped["temperature"] == 0.7
    assert "theme_color" not in dumped
