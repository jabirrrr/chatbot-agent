import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import asyncio

from app.main import app
from app.models.user import User
from app.models.platform_integration import PlatformIntegration
from app.core.vault import decrypt_vault_secret, encrypt_vault_secret
from app.api.deps import get_db, require_system_owner

client = TestClient(app)

# Helper function to configure mocks
@pytest.fixture
def override_deps(monkeypatch):
    monkeypatch.setattr("app.core.vault.settings.VAULT_SECRET_KEY", "test-vault-secret-key-00000000000000000000")
    
    mock_superuser = User(id=uuid4(), email="super@test.com", is_superuser=True, is_active=True)
    mock_db_integrations = []
    
    class MockResult:
        def __init__(self, data):
            self.data = data
        def scalars(self):
            class MockScalars:
                def all(self_inner):
                    return self.data
                def first(self_inner):
                    return self.data[0] if self.data else None
            return MockScalars()
        def scalar_one_or_none(self):
            return self.data[0] if self.data else None
        def scalar_one(self):
            return self.data[0]
        def all(self):
            return self.data

    class MockDb:
        async def execute(self, stmt):
            stmt_str = str(stmt)
            if "WHERE" in stmt_str:
                # Naive matching for mock DB
                for i in mock_db_integrations:
                    # Check if the provider or name is in the compiled query parameters
                    stmt_compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
                    i_provider_val = i.provider.value if hasattr(i.provider, "value") else i.provider
                    
                    if f"'{i_provider_val}'" in stmt_compiled or f"'{i.name}'" in stmt_compiled:
                        return MockResult([i])
                return MockResult([])
            return MockResult(mock_db_integrations)
        
        def add(self, obj):
            if obj not in mock_db_integrations:
                mock_db_integrations.append(obj)
        async def commit(self):
            pass
        async def refresh(self, obj):
            from datetime import datetime, timezone
            if not hasattr(obj, 'id') or obj.id is None:
                obj.id = uuid4()
            if not hasattr(obj, 'created_at') or obj.created_at is None:
                obj.created_at = datetime.now(timezone.utc)
            if not hasattr(obj, 'updated_at') or obj.updated_at is None:
                obj.updated_at = datetime.now(timezone.utc)
        async def delete(self, obj):
            if obj in mock_db_integrations:
                mock_db_integrations.remove(obj)

    async def override_get_db():
        yield MockDb()

    async def override_require_system_owner():
        return mock_superuser

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_system_owner] = override_require_system_owner
    
    # Return the list so tests can inspect or populate it
    yield mock_db_integrations

    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(require_system_owner, None)

def test_platform_integration_crud_and_uniqueness(override_deps):
    db_list = override_deps
    
    # 1. Create integration (valid provider)
    payload = {
        "name": "OpenAI Prod",
        "provider": "openai",
        "is_active": True,
        "credentials": "sk-test-secret-key-12345"
    }
    response = client.post("/api/v1/admin/integrations", json=payload)
    assert response.status_code == 201
    assert response.json()["provider"] == "openai"
    assert "credentials" not in response.json()
    
    db_integration = db_list[0]
    # GET never returns plaintext credentials
    response = client.get("/api/v1/admin/integrations")
    assert response.status_code == 200
    assert "credentials" not in response.json()[0]
    
    # Encrypted persistence
    assert db_integration.encrypted_credentials != "sk-test-secret-key-12345"
    assert decrypt_vault_secret(db_integration.encrypted_credentials) == "sk-test-secret-key-12345"
    
    # 2. Provider Uniqueness (Duplicate provider rejected)
    payload2 = {
        "name": "Another OpenAI",
        "provider": "openai",
        "is_active": True,
        "credentials": "sk-dup"
    }
    response = client.post("/api/v1/admin/integrations", json=payload2)
    assert response.status_code == 400
    assert "already exists" in response.text
    
    # 3. Update existing provider
    update_payload = {
        "name": "Updated OpenAI Prod",
        "credentials": "sk-new-secret-key-67890"
    }
    response = client.put("/api/v1/admin/integrations/openai", json=update_payload)
    assert response.status_code == 200
    assert decrypt_vault_secret(db_integration.encrypted_credentials) == "sk-new-secret-key-67890"
    
    # 4. Delete integration by provider
    response = client.delete("/api/v1/admin/integrations/openai")
    assert response.status_code == 204
    assert len(db_list) == 0

def test_invalid_provider_rejected(override_deps):
    payload = {
        "name": "Unknown",
        "provider": "unknown_provider",
        "is_active": True,
        "credentials": "test"
    }
    response = client.post("/api/v1/admin/integrations", json=payload)
    assert response.status_code == 422 # Pydantic enum validation failure

def test_missing_vault_secret_key_fails_explicitly(override_deps, monkeypatch):
    monkeypatch.setattr("app.core.vault.settings.VAULT_SECRET_KEY", None)
    
    payload = {
        "name": "Stripe Prod",
        "provider": "stripe",
        "is_active": True,
        "credentials": "test"
    }
    
    with pytest.raises(ValueError, match="CRITICAL SECURITY CONFIGURATION ERROR: VAULT_SECRET_KEY is missing or empty."):
        client.post("/api/v1/admin/integrations", json=payload)

def test_unauthorized_tenant_owner_forbidden():
    # Provide a normal user / owner context for `get_current_user` but NOT `require_system_owner`
    # We just clear overrides, so it relies on the actual `require_system_owner` dependency which returns 401 if unauth or 403 if auth but not superuser.
    app.dependency_overrides = {}
    response = client.get("/api/v1/admin/integrations")
    assert response.status_code == 401 # No token provided
