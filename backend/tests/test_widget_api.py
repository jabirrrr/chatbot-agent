import uuid
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation

client = TestClient(app)

mock_bot_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_conv_id = uuid.uuid4()
mock_token = "wgt_valid_test_token_123"
mock_session_token = "ses_valid_session_token_123"

mock_bot = Chatbot(
    id=mock_bot_id,
    organization_id=mock_org_id,
    name="Test Concierge",
    welcome_message="Hello and welcome!",
    theme_color="#3b82f6",
    position="bottom-right",
    lead_capture_enabled=True,
    appointment_booking_enabled=True,
    is_active=True,
    widget_token=mock_token,
    system_prompt="Help customers.",
    fallback_message="I cannot answer that.",
    model_name="anthropic/claude-3.5-sonnet",
    temperature=0.3,
    max_tokens=1024
)

mock_conv = Conversation(
    id=mock_conv_id,
    organization_id=mock_org_id,
    chatbot_id=mock_bot_id,
    visitor_id="vis_visitor_123",
    session_token=mock_session_token,
    status="active"
)


class MockDbSessionWidget:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                stmt_str = str(stmt).lower()
                try:
                    params = stmt.compile().params
                except Exception:
                    params = {}

                for k, v in params.items():
                    if "widget_token" in k:
                        if v == mock_token:
                            return mock_bot
                        return None

                if "conversations" in stmt_str:
                    return mock_conv
                elif "chatbots" in stmt_str:
                    return mock_bot
                return None

            def scalars(self):
                class MockScalars:
                    def first(self):
                        return mock_conv
                    def all(self):
                        return []
                return MockScalars()

        return MockResult()

    def add(self, entity):
        pass

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass

    async def close(self):
        pass


@pytest.fixture(autouse=True)
def setup_widget_db():
    async def override_widget_db():
        yield MockDbSessionWidget()

    app.dependency_overrides[get_db] = override_widget_db
    yield
    app.dependency_overrides.clear()


def test_widget_config_endpoint_success():
    """Validates public config fetch by valid widget token."""
    response = client.get(f"/api/v1/widget/config?token={mock_token}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Concierge"
    assert data["welcome_message"] == "Hello and welcome!"
    assert data["theme_color"] == "#3b82f6"
    assert data["position"] == "bottom-right"
    assert data["lead_capture_enabled"] is True
    # Ensure system prompt is NOT exposed
    assert "system_prompt" not in data


def test_widget_session_endpoint_success():
    """Validates starting or restoring a visitor chat session."""
    payload = {
        "widget_token": mock_token,
        "visitor_id": "vis_visitor_123"
    }
    response = client.post("/api/v1/widget/session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["session_token"] == mock_session_token
    assert data["chatbot_name"] == "Test Concierge"
    assert isinstance(data["messages"], list)


def test_widget_message_streaming_sse():
    """Validates Server-Sent Events (SSE) streaming format."""
    payload = {
        "session_token": mock_session_token,
        "message": "What are your services?"
    }
    response = client.post("/api/v1/widget/message", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    assert "data: " in response.text
