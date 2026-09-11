import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db

client = TestClient(app)


class MockDbSession:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                return None
            def scalars(self):
                class MockScalars:
                    def all(self):
                        return []
                    def first(self):
                        return None
                return MockScalars()
        return MockResult()

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass


async def override_get_db():
    yield MockDbSession()


app.dependency_overrides[get_db] = override_get_db


def test_health_check_endpoint():
    """Validates the root health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Helio Chatbot Platform" in data["service"]


def test_api_v1_health_endpoint():
    """Validates the versioned API v1 health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["api_prefix"] == "/api/v1"


def test_unauthorized_access_to_protected_route():
    """Ensures unauthenticated requests to protected endpoints return 401 Unauthorized."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]


def test_unauthorized_access_to_chatbots_route():
    """Ensures unauthenticated requests to chatbots endpoints return 401 Unauthorized."""
    response = client.get("/api/v1/chatbots/")
    assert response.status_code == 401


def test_unauthorized_access_to_knowledge_sources():
    """Ensures unauthenticated requests to knowledge endpoints return 401 Unauthorized."""
    response = client.get("/api/v1/knowledge/sources")
    assert response.status_code == 401


def test_public_widget_config_not_found():
    """Ensures non-existent widget tokens return 404 Not Found."""
    app.dependency_overrides[get_db] = override_get_db
    response = client.get("/api/v1/chatbots/public/widget/wgt_non_existent_token_123")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_invalid_bearer_token():
    """Ensures invalid Bearer tokens are strictly rejected."""
    headers = {"Authorization": "Bearer invalid.fake.token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
