import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.vault import encrypt_vault_secret
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.integration import TenantIntegration
from app.models.appointment import Appointment

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_other_org_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="integration_admin@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Alex Integrator",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Test Org",
    slug="test-org"
)

mock_integration = TenantIntegration(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    provider="google_calendar",
    encrypted_credentials=encrypt_vault_secret('{"access_token": "ya29.mock_token", "refresh_token": "1//mock_refresh", "stored_at": 1700000000, "expires_in": 3600}'),
    status="connected",
    metadata_json={"account_email": "admin@test-org.com"}
)


class MockDbIntegrations:
    def __init__(self, integration_exists: bool = True):
        self.integration_exists = integration_exists

    async def execute(self, stmt):
        class MockResult:
            def __init__(self, exists):
                self.exists = exists

            def scalar_one_or_none(self):
                return mock_integration if self.exists else None

            def scalars(self):
                class MockScalars:
                    def __init__(self, exists):
                        self.exists = exists
                    def all(self):
                        return [mock_integration] if self.exists else []
                    def first(self):
                        return mock_integration if self.exists else None
                return MockScalars(self.exists)

        return MockResult(self.integration_exists)

    def add(self, entity):
        entity.id = uuid.uuid4()
        entity.created_at = datetime.now(timezone.utc)
        entity.updated_at = datetime.now(timezone.utc)

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass

    async def delete(self, entity):
        pass


def test_get_integrations_status_unauthorized():
    response = client.get("/api/v1/integrations/status")
    assert response.status_code == 401


def test_get_integrations_status_connected():
    async def override_get_db():
        yield MockDbIntegrations(integration_exists=True)

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/integrations/status")
    assert response.status_code == 200
    data = response.json()
    assert "integrations" in data
    assert "google_calendar" in data["integrations"]
    assert data["integrations"]["google_calendar"]["connected"] is True


def test_get_google_calendar_auth_url():
    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/integrations/google-calendar/auth-url")
    assert response.status_code == 200
    data = response.json()
    assert "auth_url" in data
    assert data["provider"] == "google_calendar"
    assert "accounts.google.com" in data["auth_url"]


def test_google_oauth_callback_success():
    async def override_get_db():
        yield MockDbIntegrations(integration_exists=False)

    app.dependency_overrides[get_db] = override_get_db

    state_token = create_access_token(
        subject=str(mock_org_id),
        extra_claims={
            "org_id": str(mock_org_id),
            "user_id": str(mock_user_id),
            "oauth_flow": "google_calendar",
            "type": "google_oauth_state"
        }
    )

    response = client.get(
        f"/api/v1/integrations/google-calendar/callback?code=mock_code_123&state={state_token}",
        follow_redirects=False
    )
    assert response.status_code == 302
    assert "gcal_success=true" in response.headers["location"]


def test_google_oauth_callback_error_cancelled():
    response = client.get(
        "/api/v1/integrations/google-calendar/callback?error=access_denied",
        follow_redirects=False
    )
    assert response.status_code == 302
    assert "gcal_error=access_denied" in response.headers["location"]


def test_google_oauth_callback_invalid_state():
    response = client.get(
        "/api/v1/integrations/google-calendar/callback?code=mock_code&state=invalid_garbage_token",
        follow_redirects=False
    )
    assert response.status_code == 302
    assert "gcal_error=invalid_state_token" in response.headers["location"]


def test_disconnect_google_calendar():
    async def override_get_db():
        yield MockDbIntegrations(integration_exists=True)

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post("/api/v1/integrations/google-calendar/disconnect")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] == "google_calendar"
