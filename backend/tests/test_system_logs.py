import asyncio
import json
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User
from app.api.deps import get_db, get_current_user
from app.core.log_event_bus import log_bus, sanitize_string, sanitize_metadata, LogEventBus

client = TestClient(app)

def make_mock_user(role: str = "super_user", is_active: bool = True) -> User:
    return User(
        id=uuid4(),
        email=f"{role}@example.com",
        hashed_password="secure_password_hash",
        full_name=f"Test {role.title()}",
        is_active=is_active,
        is_verified=True,
        platform_role=role
    )

class MockDb:
    async def execute(self, stmt):
        class MockResult:
            def scalar(self):
                return 1
            def scalars(self):
                class MockScalars:
                    def all(self):
                        return []
                return MockScalars()
            def scalar_one_or_none(self):
                return None
        return MockResult()

    async def commit(self):
        pass

    async def refresh(self, instance):
        pass

async def override_db():
    yield MockDb()


# --------------------------------------------------------------------------
# 1. Authorization Tests (Enforcing super_user only)
# --------------------------------------------------------------------------
def test_logs_history_unauthenticated():
    app.dependency_overrides.clear()
    res = client.get("/api/v1/admin/logs/history")
    assert res.status_code == 401

def test_logs_history_normal_user_forbidden():
    app.dependency_overrides.clear()
    normal_user = make_mock_user(role="normal_user")
    app.dependency_overrides[get_current_user] = lambda: normal_user
    app.dependency_overrides[get_db] = override_db

    res = client.get("/api/v1/admin/logs/history")
    assert res.status_code == 403
    assert "System Owner" in res.json().get("detail", "")
    app.dependency_overrides.clear()

def test_logs_history_admin_user_forbidden():
    """Verify that ordinary admin_user is NOT allowed — strictly super_user only."""
    app.dependency_overrides.clear()
    admin_user = make_mock_user(role="admin_user")
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = override_db

    res = client.get("/api/v1/admin/logs/history")
    assert res.status_code == 403
    app.dependency_overrides.clear()

def test_logs_history_super_user_success():
    app.dependency_overrides.clear()
    super_user = make_mock_user(role="super_user")
    app.dependency_overrides[get_current_user] = lambda: super_user
    app.dependency_overrides[get_db] = override_db

    # Emit a test event
    log_bus.emit(
        source="SYSTEM",
        level="INFO",
        message="Super user test verification log",
        metadata={"component": "test_suite"}
    )

    res = client.get("/api/v1/admin/logs/history")
    assert res.status_code == 200
    data = res.json()
    assert "logs" in data
    assert "total_available" in data
    assert "redis_connected" in data
    assert "is_process_local_only" in data
    assert "storage_notice" in data
    assert isinstance(data["logs"], list)
    assert len(data["logs"]) >= 1
    app.dependency_overrides.clear()


# --------------------------------------------------------------------------
# 2. Sanitization Tests
# --------------------------------------------------------------------------
def test_string_sanitizer():
    # Database connection string
    raw_db = "Connected to postgresql://admin_user:SuperSecretPassword123@db.prod.internal:5432/main_db successfully"
    sanitized_db = sanitize_string(raw_db)
    assert "SuperSecretPassword123" not in sanitized_db
    assert "postgresql://***@" in sanitized_db

    # Redis connection string
    raw_redis = "Failed redis://:mypassword@redis-cluster:6379/0"
    sanitized_redis = sanitize_string(raw_redis)
    assert "mypassword" not in sanitized_redis
    assert "redis://***@" in sanitized_redis

    # Bearer token
    raw_bearer = "Authorization failed with Bearer secret-auth-token-xyz-123456"
    sanitized_bearer = sanitize_string(raw_bearer)
    assert "secret-auth-token-xyz-123456" not in sanitized_bearer
    assert "Bearer ***" in sanitized_bearer

    # JWT token
    raw_jwt = "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c expired"
    sanitized_jwt = sanitize_string(raw_jwt)
    assert "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" not in sanitized_jwt
    assert "[REDACTED_JWT]" in sanitized_jwt

    # Key-value secret
    raw_kv = "User request payload: password=SecretPlainTextPassword&api_key=sk-live-9999"
    sanitized_kv = sanitize_string(raw_kv)
    assert "SecretPlainTextPassword" not in sanitized_kv
    assert "sk-live-9999" not in sanitized_kv

def test_recursive_metadata_sanitization():
    dirty_meta = {
        "user_id": "usr-123",
        "action": "login",
        "password": "plaintext_password",
        "token": "secret_jwt_token",
        "changes": {
            "hashed_password": "argon_hash",
            "role": "admin",
            "api_key": "secret_key"
        },
        "disallowed_custom_key": "some_value"
    }
    cleaned = sanitize_metadata(dirty_meta, depth=0)
    # Root level unallowlisted key removed
    assert "disallowed_custom_key" not in cleaned
    # Sensitive keys removed
    assert "password" not in cleaned
    assert "token" not in cleaned
    # Allowlisted keys retained
    assert cleaned["user_id"] == "usr-123"
    assert cleaned["action"] == "login"

    # Nested changes: api_key and hashed_password removed, role kept
    changes = cleaned.get("changes", {})
    assert "hashed_password" not in changes
    assert "api_key" not in changes
    assert changes.get("role") == "admin"


# --------------------------------------------------------------------------
# 3. Buffer Capping & Filtering Tests
# --------------------------------------------------------------------------
def test_history_filtering_and_capping():
    test_bus = LogEventBus()

    # Fill beyond max history (550 events)
    for i in range(550):
        level = "ERROR" if i % 10 == 0 else "INFO"
        source = "DATABASE" if i % 5 == 0 else "API"
        test_bus.emit(
            source=source,
            level=level,
            message=f"Synthetic event iteration {i}",
            metadata={"component": "test", "worker_id": f"w-{i % 3}"}
        )

    # Check buffer cap
    hist = test_bus.get_history(limit=500)
    assert len(hist.logs) <= 500
    assert hist.total_available == 500

    # Filter by level
    err_hist = test_bus.get_history(level="ERROR", limit=100)
    for entry in err_hist.logs:
        assert entry.level == "ERROR"

    # Filter by source
    db_hist = test_bus.get_history(source="DATABASE", limit=100)
    for entry in db_hist.logs:
        assert entry.source == "DATABASE"

    # Search filter
    search_hist = test_bus.get_history(search="iteration 54", limit=100)
    for entry in search_hist.logs:
        assert "54" in entry.message


# --------------------------------------------------------------------------
# 4. Anti-Recursion Protection
# --------------------------------------------------------------------------
def test_anti_recursion_guard():
    test_bus = LogEventBus()
    # Emitting with malformed or circular dict must not raise
    circular_dict = {}
    circular_dict["self"] = circular_dict

    # Should safely handle recursion depth limit without crashing
    test_bus.emit(
        source="SYSTEM",
        level="ERROR",
        message="Testing circular metadata",
        metadata=circular_dict
    )
    hist = test_bus.get_history(limit=1)
    assert len(hist.logs) == 1
    assert hist.logs[0].message == "Testing circular metadata"


# --------------------------------------------------------------------------
# 5. Concurrent Connection Limits & Stream Cleanup
# --------------------------------------------------------------------------
def test_concurrent_subscriber_limits():
    test_bus = LogEventBus()
    queues = []

    # Subscribe 10 clients (MAX_SUBSCRIBERS = 10)
    for _ in range(10):
        q = test_bus.subscribe()
        queues.append(q)

    assert test_bus.get_subscriber_count() == 10

    # 11th client must trigger 429 Too Many Requests
    with pytest.raises(Exception) as exc_info:
        test_bus.subscribe()
    assert "429" in str(exc_info.value) or "Concurrent" in str(exc_info.value)

    # Disconnect one client
    test_bus.unsubscribe(queues[0])
    assert test_bus.get_subscriber_count() == 9

    # Now an 11th client can successfully subscribe
    new_q = test_bus.subscribe()
    assert test_bus.get_subscriber_count() == 10

    # Cleanup
    for q in queues[1:] + [new_q]:
        test_bus.unsubscribe(q)
    assert test_bus.get_subscriber_count() == 0


# --------------------------------------------------------------------------
# 6. Stream SSE Endpoint Access Control
# --------------------------------------------------------------------------
def test_stream_unauthorized():
    app.dependency_overrides.clear()
    res = client.get("/api/v1/admin/logs/stream")
    assert res.status_code == 401

def test_stream_forbidden_for_admin_user():
    app.dependency_overrides.clear()
    admin_user = make_mock_user(role="admin_user")
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = override_db

    res = client.get("/api/v1/admin/logs/stream")
    assert res.status_code == 403
    app.dependency_overrides.clear()


# --------------------------------------------------------------------------
# 7. Post-Commit Audit Events in Admin Service
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_admin_service_audit_events():
    from app.services.admin_service import update_user, delete_user
    from app.schemas.admin_users import AdminUserUpdate

    super_user = make_mock_user(role="super_user")
    target_user = make_mock_user(role="normal_user")

    class MockUserDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return target_user
                def scalar(self):
                    return 2
            return MockResult()

        async def commit(self):
            pass

        async def refresh(self, instance):
            pass

    db = MockUserDb()

    # Clear recent test logs
    log_bus._history.clear()

    # 1. Update user
    update_data = AdminUserUpdate(full_name="New Updated Name", is_active=True)
    await update_user(db=db, user_id=target_user.id, update_data=update_data, current_user=super_user)

    hist = log_bus.get_history(limit=10)
    assert any("updated user" in entry.message and entry.source == "AUTH" for entry in hist.logs)

    # 2. Deactivate user
    await delete_user(db=db, user_id=target_user.id, current_user=super_user)

    hist = log_bus.get_history(limit=10)
    assert any("deactivated user" in entry.message and entry.source == "AUTH" for entry in hist.logs)
