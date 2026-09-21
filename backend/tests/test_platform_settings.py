import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from datetime import datetime, timezone
import json

from app.main import app
from app.models.user import User
from app.api.deps import get_db, get_current_user_optional, check_maintenance_mode
from app.models.platform_setting import PlatformSetting

client = TestClient(app)

def test_maintenance_mode_blocks_normal_user(monkeypatch):
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="normal@test.com",
        is_superuser=False
    )
    
    mock_settings = PlatformSetting(
        id=1,
        maintenance_mode=True,
        maintenance_message="Under maintenance"
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_settings
            return MockResult()

    async def override_db():
        yield MockDb()

    async def override_user_optional():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user_optional] = override_user_optional
    app.dependency_overrides.pop(check_maintenance_mode, None)

    try:
        # organizations route is protected by maintenance mode
        res = client.get("/api/v1/organizations")
        assert res.status_code == 503
        assert res.json()["detail"] == "Under maintenance"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user_optional, None)


def test_maintenance_mode_allows_superuser(monkeypatch):
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="super@test.com",
        is_superuser=True
    )
    
    mock_settings = PlatformSetting(
        id=1,
        maintenance_mode=True,
        maintenance_message="Under maintenance"
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_settings
            return MockResult()

    async def override_db():
        yield MockDb()

    async def override_user_optional():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user_optional] = override_user_optional
    app.dependency_overrides.pop(check_maintenance_mode, None)

    try:
        # Need to also override the auth for organizations since it needs a real user/org
        # For simplicity, we just check if it gets past the 503
        # In reality it will hit a 401/403 or 404 from the actual endpoint logic
        res = client.get("/api/v1/organizations")
        assert res.status_code != 503
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user_optional, None)

def test_maintenance_mode_exemptions(monkeypatch):
    mock_settings = PlatformSetting(
        id=1,
        maintenance_mode=True,
        maintenance_message="Under maintenance"
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_settings
            return MockResult()

    async def override_db():
        yield MockDb()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides.pop(check_maintenance_mode, None)

    try:
        # OAuth callbacks should be exempted
        res = client.get("/api/v1/integrations/google-calendar/callback?code=test")
        # Should not be 503. Will likely be 401/404 or something else depending on routing
        assert res.status_code != 503
        
        # Webhooks should be exempted
        res = client.post("/api/v1/billing/webhook")
        assert res.status_code != 503
    finally:
        app.dependency_overrides.pop(get_db, None)

from app.api.deps import require_system_owner

def test_negative_max_tenants_rejected(monkeypatch):
    mock_superuser = User(id=uuid4(), email="super@test.com", is_superuser=True, is_active=True)
    
    mock_settings = PlatformSetting(
        id=1,
        allow_signups=True,
        max_tenants_allowed=10,
        maintenance_mode=False,
        maintenance_message=""
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_settings
            return MockResult()
        def add(self, obj):
            pass
        async def commit(self):
            pass
        async def refresh(self, obj):
            pass

    async def override_db():
        yield MockDb()
        
    async def override_require_system_owner():
        return mock_superuser

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[require_system_owner] = override_require_system_owner

    try:
        payload = {
            "max_tenants_allowed": -1
        }
        res = client.put("/api/v1/admin/settings", json=payload)
        assert res.status_code == 422 # Unprocessable Entity due to Field(ge=0) validation
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(require_system_owner, None)
