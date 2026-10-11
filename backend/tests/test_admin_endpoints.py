import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.models.user import User
from app.models.organization import Organization
from app.models.conversation import Conversation
from app.models.ai_usage import AIUsageRecord
from app.models.organization_member import OrganizationMember, MemberRole

from app.api.deps import get_db, get_current_user, get_current_organization
from app.main import app

client = TestClient(app)

def test_get_overview():
    # Setup mock user
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )
    
    class MockOverviewDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockResult:
                def scalar(self):
                    if "ai_usage_records" in stmt_str:
                        return Decimal("123.45")
                    elif "organizations" in stmt_str:
                        return 10
                    elif "users" in stmt_str:
                        return 50
                    elif "conversations" in stmt_str:
                        return 100
                    return 0
            return MockResult()

    async def override_db():
        yield MockOverviewDb()

    async def override_user():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.get("/api/v1/admin/overview")
        assert res.status_code == 200
        data = res.json()
        assert data["total_organizations"] == 10
        assert data["total_users"] == 50
        assert data["total_conversations"] == 100
        assert data["total_ai_cost_usd"] == "123.45"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_get_users():
    # Setup mock user
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )
    
    mock_target_user = User(
        id=uuid4(),
        email="target@chatly.ai",
        hashed_password="hash",
        full_name="Target User",
        is_active=True,
        is_verified=True,
        platform_role="normal_user",
        created_at=datetime.now(timezone.utc)
    )

    class MockUsersDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockResult:
                def scalar(self):
                    if "count" in stmt_str and "organization_members" in stmt_str:
                        return 2
                    if "count" in stmt_str:
                        return 1
                    return 0
                def scalars(self):
                    class MockScalars:
                        def all(self):
                            return [mock_target_user]
                    return MockScalars()
            return MockResult()

    async def override_db():
        yield MockUsersDb()

    async def override_user():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.get("/api/v1/admin/users?page=1&size=10&search=target")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1
        assert data["page"] == 1
        assert data["size"] == 10
        assert data["pages"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["email"] == "target@chatly.ai"
        assert data["items"][0]["organization_count"] == 2
        
        # ensure no hashed_password
        assert "hashed_password" not in data["items"][0]
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)

def test_get_analytics_timeseries():
    # Setup mock user
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )
    
    class MockRow:
        def __init__(self, bucket, count=0, cost=Decimal("0.0")):
            self.bucket = bucket
            self.count = count
            self.cost = cost

    class MockAnalyticsDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            bucket_time = datetime(2023, 1, 1, tzinfo=timezone.utc)
            class MockResult:
                def all(self):
                    if "ai_usage_records" in stmt_str:
                        return [MockRow(bucket_time, cost=Decimal("15.50"))]
                    else:
                        return [MockRow(bucket_time, count=3)]
            return MockResult()

    async def override_db():
        yield MockAnalyticsDb()

    async def override_user():
        return mock_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    
    try:
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        end_date = datetime.now(timezone.utc).isoformat()
        res = client.get(
            "/api/v1/admin/analytics/timeseries",
            params={
                "interval": "day",
                "start_date": start_date,
                "end_date": end_date
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["interval"] == "day"
        assert len(data["data"]) == 1
        point = data["data"][0]
        assert point["date"] == "2023-01-01T00:00:00Z"
        assert point["new_users"] == 3
        assert point["new_organizations"] == 3
        assert point["new_conversations"] == 3
        assert point["ai_cost_usd"] == "15.50"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_delete_user_success():
    super_user_id = uuid4()
    mock_super_user = User(
        id=super_user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )
    
    target_user_id = uuid4()
    mock_target_user = User(
        id=target_user_id,
        email="normal@chatly.ai",
        hashed_password="hash",
        full_name="Normal User",
        is_active=True,
        is_verified=True,
        platform_role="normal_user",
        created_at=datetime.now(timezone.utc)
    )

    class MockDeleteDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockResult:
                def scalar_one_or_none(self):
                    if "users" in stmt_str:
                        return mock_target_user
                    return None
                def scalar(self):
                    if "organization_members" in stmt_str:
                        return 2
                    return 0
            return MockResult()

        async def commit(self):
            pass

        async def refresh(self, obj):
            pass

    async def override_db():
        yield MockDeleteDb()

    async def override_user():
        return mock_super_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.delete(f"/api/v1/admin/users/{target_user_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(target_user_id)
        assert data["email"] == "normal@chatly.ai"
        assert data["is_active"] is False
        assert data["organization_count"] == 2
        assert mock_target_user.is_active is False
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_delete_user_self_protection():
    super_user_id = uuid4()
    mock_super_user = User(
        id=super_user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_super_user
            return MockResult()

    async def override_db():
        yield MockDb()

    async def override_user():
        return mock_super_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.delete(f"/api/v1/admin/users/{super_user_id}")
        assert res.status_code == 409
        data = res.json()
        assert "cannot deactivate your own account" in data["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_delete_user_last_super_user():
    super_user_id = uuid4()
    mock_super_user = User(
        id=super_user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )

    target_super_id = uuid4()
    mock_target_super = User(
        id=target_super_id,
        email="other_super@chatly.ai",
        hashed_password="hash",
        full_name="Other Super User",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_target_super
                def scalar(self):
                    # check_last_super_user count = 1
                    return 1
            return MockResult()

    async def override_db():
        yield MockDb()

    async def override_user():
        return mock_super_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.delete(f"/api/v1/admin/users/{target_super_id}")
        assert res.status_code == 409
        data = res.json()
        assert "at least one active super user must remain" in data["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_delete_user_forbidden_for_non_super_user():
    admin_user_id = uuid4()
    mock_admin_user = User(
        id=admin_user_id,
        email="admin@chatly.ai",
        hashed_password="hash",
        full_name="Platform Admin",
        is_active=True,
        is_verified=True,
        platform_role="admin_user"
    )

    target_user_id = uuid4()

    async def override_user():
        return mock_admin_user

    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.delete(f"/api/v1/admin/users/{target_user_id}")
        assert res.status_code == 403
        data = res.json()
        assert "operation requires platform system owner privileges" in data["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_user_success():
    super_user_id = uuid4()
    mock_super_user = User(
        id=super_user_id,
        email="owner@chatly.ai",
        hashed_password="hash",
        full_name="Platform System Owner",
        is_active=True,
        is_verified=True,
        platform_role="super_user"
    )

    target_user_id = uuid4()
    mock_target_user = User(
        id=target_user_id,
        email="target@chatly.ai",
        hashed_password="hash",
        full_name="Old Name",
        is_active=False,
        is_verified=True,
        platform_role="normal_user",
        created_at=datetime.now(timezone.utc)
    )

    class MockPatchDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockResult:
                def scalar_one_or_none(self):
                    return mock_target_user
                def scalar(self):
                    if "organization_members" in stmt_str:
                        return 3
                    return 0
            return MockResult()

        async def commit(self):
            pass

        async def refresh(self, obj):
            pass

    async def override_db():
        yield MockPatchDb()

    async def override_user():
        return mock_super_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.patch(
            f"/api/v1/admin/users/{target_user_id}",
            json={"full_name": "New Name", "is_active": True, "platform_role": "admin_user"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(target_user_id)
        assert data["full_name"] == "New Name"
        assert data["is_active"] is True
        assert data["platform_role"] == "admin_user"
        assert data["organization_count"] == 3
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_user_forbidden_for_non_super_user():
    admin_user_id = uuid4()
    mock_admin_user = User(
        id=admin_user_id,
        email="admin@chatly.ai",
        hashed_password="hash",
        full_name="Platform Admin",
        is_active=True,
        is_verified=True,
        platform_role="admin_user"
    )

    target_user_id = uuid4()

    async def override_user():
        return mock_admin_user

    app.dependency_overrides[get_current_user] = override_user
    try:
        res = client.patch(
            f"/api/v1/admin/users/{target_user_id}",
            json={"full_name": "Hacked Name"}
        )
        assert res.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_global_exception_handler_trusted_origin_cors():
    from fastapi import APIRouter
    
    test_router = APIRouter()
    @test_router.get("/test-unhandled-crash")
    async def crash_endpoint():
        raise RuntimeError("Intentional test crash")

    app.include_router(test_router)

    error_client = TestClient(app, raise_server_exceptions=False)
    res = error_client.get("/test-unhandled-crash", headers={"Origin": "https://chatbot-agent-lemon.vercel.app"})
    assert res.status_code == 500
    assert res.headers.get("access-control-allow-origin") == "https://chatbot-agent-lemon.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"
    assert res.json() == {"detail": "An unexpected internal server error occurred."}
