import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


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


def test_invalid_bearer_token():
    """Ensures invalid Bearer tokens are strictly rejected."""
    headers = {"Authorization": "Bearer invalid.fake.token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
