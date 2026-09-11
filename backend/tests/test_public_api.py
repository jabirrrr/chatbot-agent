import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.api_key import ApiKey
from app.models.lead import Lead
from app.models.conversation import Conversation
from app.services.api_key_service import ApiKeyService, hash_api_key

client = TestClient(app)

mock_org_id = uuid.uuid4()
plaintext_key, mock_api_key = ApiKeyService.create_key_pair(
    name="Test API Key",
    organization_id=mock_org_id
)

mock_lead = Lead(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    name="Public API Lead",
    email="public@external.com",
    phone="+1-555-4321",
    status="new",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)

mock_conv = Conversation(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    chatbot_id=uuid.uuid4(),
    visitor_id="vis_public_api_111",
    session_token="ses_public_api_111",
    status="active",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionPublicApi:
    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class MockResult:
            def scalar_one_or_none(self):
                if "api_keys" in stmt_str:
                    return mock_api_key
                return None

            def scalar(self):
                return 1

            def scalars(self):
                class MockScalars:
                    def all(self):
                        if "leads" in stmt_str:
                            return [mock_lead]
                        elif "conversations" in stmt_str:
                            return [mock_conv]
                        return []
                return MockScalars()

        return MockResult()

    def add(self, entity):
        entity.id = uuid.uuid4()
        entity.created_at = datetime.now(timezone.utc)

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_public_api_key_pair_generation():
    key, model = ApiKeyService.create_key_pair(name="Zapier Integration", organization_id=mock_org_id)
    assert key.startswith("cba_live_")
    assert model.prefix.startswith("cba_live_")
    assert model.hashed_key == hash_api_key(key)
    assert "leads:read" in model.scopes


def test_public_api_missing_key_header_unauthorized():
    response = client.get("/api/v1/public/leads")
    assert response.status_code == 401
    assert "Missing X-API-Key" in response.json()["detail"]


def test_public_api_list_leads_with_valid_key():
    async def override_get_db():
        yield MockDbSessionPublicApi()

    app.dependency_overrides[get_db] = override_get_db

    headers = {"X-API-Key": plaintext_key}
    response = client.get("/api/v1/public/leads", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Public API Lead"


def test_public_api_create_lead_with_valid_key():
    async def override_get_db():
        yield MockDbSessionPublicApi()

    app.dependency_overrides[get_db] = override_get_db

    headers = {"X-API-Key": plaintext_key}
    payload = {
        "name": "Zapier Webhook Lead",
        "email": "zapier.lead@enterprise.com",
        "notes": "Pushed via Zapier Public API"
    }
    response = client.post("/api/v1/public/leads", headers=headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Zapier Webhook Lead"
    assert data["email"] == "zapier.lead@enterprise.com"


def test_public_api_list_conversations_with_valid_key():
    async def override_get_db():
        yield MockDbSessionPublicApi()

    app.dependency_overrides[get_db] = override_get_db

    headers = {"X-API-Key": plaintext_key}
    response = client.get("/api/v1/public/conversations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["visitor_id"] == "vis_public_api_111"
