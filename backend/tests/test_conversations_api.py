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

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_conv_id = uuid.uuid4()
mock_bot_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="operator@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Alice Operator",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Acme Corp",
    slug="acme-corp"
)

mock_conv = Conversation(
    id=mock_conv_id,
    organization_id=mock_org_id,
    chatbot_id=mock_bot_id,
    visitor_id="vis_visitor_888",
    session_token="ses_test_session_888",
    status="active",
    summary="Inquiry about pricing plans",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)

mock_msg = Message(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    conversation_id=mock_conv_id,
    sender_type="visitor",
    content="What are your enterprise rates?",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionConversations:
    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class MockResult:
            def scalar_one_or_none(self):
                return mock_conv

            def scalar(self):
                return 1

            def scalars(self):
                class MockScalars:
                    def all(self):
                        if "messages" in stmt_str:
                            return [mock_msg]
                        return [mock_conv]
                    def first(self):
                        return mock_conv
                return MockScalars()

        return MockResult()

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_list_conversations_unauthorized():
    response = client.get("/api/v1/conversations/")
    assert response.status_code == 401


def test_list_conversations_with_mock_db():
    async def override_get_db():
        yield MockDbSessionConversations()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/conversations/?search=pricing&status=active")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "active"
    assert data["items"][0]["visitor_id"] == "vis_visitor_888"


def test_get_conversation_thread_with_messages():
    async def override_get_db():
        yield MockDbSessionConversations()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get(f"/api/v1/conversations/{mock_conv_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(mock_conv_id)
    assert len(data["messages"]) == 1
    assert data["messages"][0]["content"] == "What are your enterprise rates?"


def test_update_conversation_status():
    async def override_get_db():
        yield MockDbSessionConversations()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.patch(
        f"/api/v1/conversations/{mock_conv_id}",
        json={"status": "closed", "summary": "Resolved after pricing explanation"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "closed"
