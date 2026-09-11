import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.conversation import Conversation, Message
from app.services.handoff_service import ws_manager

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_conv_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="agent@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Sarah Jenkins",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Acme Support",
    slug="acme-support"
)

mock_conv = Conversation(
    id=mock_conv_id,
    organization_id=mock_org_id,
    chatbot_id=uuid.uuid4(),
    visitor_id="vis_support_444",
    session_token="ses_support_token_444",
    status="active",
    metadata_json={},
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionHandoff:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                return mock_conv

        return MockResult()

    def add(self, entity):
        entity.id = uuid.uuid4()
        entity.created_at = datetime.now(timezone.utc)

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_request_handoff_endpoint():
    async def override_get_db():
        yield MockDbSessionHandoff()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post(
        f"/api/v1/conversations/{mock_conv_id}/handoff",
        json={"reason": "Complex billing discrepancy"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "waiting_handoff"


def test_operator_takeover_endpoint():
    async def override_get_db():
        yield MockDbSessionHandoff()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post(f"/api/v1/conversations/{mock_conv_id}/takeover")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"


def test_operator_reply_endpoint():
    async def override_get_db():
        yield MockDbSessionHandoff()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post(
        f"/api/v1/conversations/{mock_conv_id}/reply",
        json={"content": "Hello! I am taking over this conversation to help you directly."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender_type"] == "agent"
    assert "taking over" in data["content"]


def test_websocket_connection_and_ping():
    with client.websocket_connect(f"/api/v1/ws/conversations?org_id={mock_org_id}") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"
