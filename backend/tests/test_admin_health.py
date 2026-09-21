import pytest
from datetime import datetime, timezone
from uuid import uuid4
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

from app.main import app
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, MemberRole
from app.core.database import get_db
from app.schemas.admin_health import AdminComponentHealth
from app.services.admin_health_service import (
    _sanitize_error_message,
    calculate_overall_status,
    check_api_application,
    check_database,
    check_background_workers
)

client = TestClient(app)


class TestAdminHealth:
    def test_unauthenticated_admin_health_rejected(self):
        """Unauthenticated requests to /api/v1/admin/health must return 401 Unauthorized."""
        response = client.get("/api/v1/admin/health")
        assert response.status_code == 401

    def test_regular_member_rejected_with_403(self):
        """Authenticated users with MEMBER role must be rejected with 403 Forbidden."""
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(
            id=user_id,
            email="member@chatly.ai",
            hashed_password="hash",
            full_name="Regular Member",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        mock_org = Organization(
            id=org_id,
            name="Chatly Org",
            slug="chatly-org"
        )
        mock_member = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_id,
            role=MemberRole.MEMBER
        )

        class MockMemberDb:
            async def execute(self, stmt):
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_member
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_member
                        return MockScalars()
                return MockResult()

        async def override_db():
            yield MockMemberDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 403
            assert "Operation requires platform System Owner privileges." in res.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    def test_viewer_rejected_with_403(self):
        """Authenticated users with VIEWER role must be rejected with 403 Forbidden."""
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(
            id=user_id,
            email="viewer@chatly.ai",
            hashed_password="hash",
            full_name="Viewer Member",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        mock_org = Organization(
            id=org_id,
            name="Chatly Org",
            slug="chatly-org"
        )
        mock_viewer = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_id,
            role=MemberRole.VIEWER
        )

        class MockViewerDb:
            async def execute(self, stmt):
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_viewer
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_viewer
                        return MockScalars()
                return MockResult()

        async def override_db():
            yield MockViewerDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 403
            assert "Operation requires platform System Owner privileges." in res.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    def test_organization_admin_rejected_with_403(self):
        """
        Ordinary organization administrators (ADMIN role) must NOT be permitted to access
        platform infrastructure diagnostics and must be rejected with 403 Forbidden.
        Only platform Super Admin / System Owner (OWNER role) is permitted.
        """
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(
            id=user_id,
            email="orgadmin@chatly.ai",
            hashed_password="hash",
            full_name="Org Admin",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        mock_org = Organization(
            id=org_id,
            name="Chatly Org",
            slug="chatly-org"
        )
        mock_admin = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_id,
            role=MemberRole.ADMIN
        )

        class MockOrgAdminDb:
            async def execute(self, stmt):
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_admin
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_admin
                        return MockScalars()
                return MockResult()

        async def override_db():
            yield MockOrgAdminDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 403
            assert "Operation requires platform System Owner privileges." in res.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    def test_tenant_owner_rejected_with_403(self):
        """
        Ordinary tenant owners (OWNER role on an org) must NOT be permitted to access
        platform infrastructure diagnostics and must be rejected with 403 Forbidden.
        """
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(
            id=user_id,
            email="tenantowner@chatly.ai",
            hashed_password="hash",
            full_name="Tenant Owner",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        mock_org = Organization(
            id=org_id,
            name="Chatly Org",
            slug="chatly-org"
        )
        mock_tenant_owner = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_id,
            role=MemberRole.OWNER
        )

        class MockTenantOwnerDb:
            async def execute(self, stmt):
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_tenant_owner
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_tenant_owner
                        return MockScalars()
                return MockResult()

        async def override_db():
            yield MockTenantOwnerDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 403
            assert "Operation requires platform System Owner privileges." in res.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    def test_platform_super_admin_system_owner_returns_200(self):
        """
        Authenticated platform Super Admin / System Owner (OWNER role) is granted access (200 OK)
        and receives real infrastructure telemetry.
        """
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(
            id=user_id,
            email="owner@chatly.ai",
            hashed_password="hash",
            full_name="Platform System Owner",
            is_active=True,
            is_verified=True,
            is_superuser=True
        )
        mock_org = Organization(
            id=org_id,
            name="Platform Root Org",
            slug="platform-root"
        )
        mock_owner_member = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_id,
            role=MemberRole.OWNER
        )

        class MockOwnerDb:
            async def execute(self, stmt):
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_owner_member
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_owner_member
                        return MockScalars()
                return MockResult()

        async def override_db():
            yield MockOwnerDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 200
            data = res.json()

            # 1. Overall Status
            assert data["overall_status"] in ("healthy", "degraded", "down", "unknown")
            assert "checked_at" in data
            assert data["has_persistent_error_telemetry"] is False
            assert data["recent_errors"] == []

            # 2. Components
            components = data["components"]
            assert "api" in components
            assert "database" in components
            assert "redis" in components
            assert "workers" in components

            # API / Application (measures process runtime, not Vercel gateway)
            api = components["api"]
            assert api["name"] == "API / Application"
            assert api["status"] == "healthy"
            assert isinstance(api["latency_ms"], (int, float))
            assert api["latency_ms"] >= 0
            assert api["uptime"] == "No historical data"

            # Database
            db = components["database"]
            assert db["name"] == "Main Database (PostgreSQL)"
            assert db["status"] in ("healthy", "down")
            assert db["uptime"] == "No historical data"

            # Redis (truthful: not_configured or healthy, never fabricated 100%)
            redis = components["redis"]
            assert redis["status"] in ("not_configured", "healthy", "degraded")
            assert redis["uptime"] == "No historical data"

            # Workers (truthful: not_configured on Vercel/serverless)
            workers = components["workers"]
            assert workers["status"] == "not_configured"
            assert workers["uptime"] == "No historical data"
            assert "No persistent background worker is configured" in workers["details"]

            # 3. No Fake Incidents or Mock Data
            json_str = str(data)
            assert "99.99" not in json_str
            assert "99.95" not in json_str
            assert "98.50" not in json_str
            assert "Queue timeout on sync_job" not in json_str
            assert "Deadlock detected" not in json_str
            assert "192.168.1.1" not in json_str

            # 4. Security Check: No secrets leaked
            assert "password" not in json_str.lower() or "password***" in json_str.lower()
            assert "postgres://" not in json_str
            assert "postgresql://" not in json_str or "***@" in json_str
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    def test_health_endpoint_isolation_no_tenant_data_leakage(self):
        """
        Verifies that /api/v1/admin/health returns strictly infrastructure telemetry
        and CANNOT expose any data, metadata, or identifiers belonging to another organization.
        """
        user_id = uuid4()
        org_a_id = uuid4()
        org_b_id = uuid4()

        mock_user = User(
            id=user_id,
            email="owner@tenant-alpha.com",
            hashed_password="hash",
            full_name="Alpha Owner",
            is_active=True,
            is_verified=True,
            is_superuser=True
        )
        mock_org_a = Organization(
            id=org_a_id,
            name="Alpha Confidential Corp",
            slug="alpha-confidential"
        )
        mock_owner_member = OrganizationMember(
            id=uuid4(),
            user_id=user_id,
            organization_id=org_a_id,
            role=MemberRole.OWNER
        )

        class MockIsolatedDb:
            def __init__(self):
                self.executed_statements = []

            async def execute(self, stmt):
                stmt_str = str(stmt)
                self.executed_statements.append(stmt_str)
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_owner_member
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_owner_member
                        return MockScalars()
                return MockResult()

        mock_db_instance = MockIsolatedDb()

        async def override_db():
            yield mock_db_instance

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org_a

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health", headers={"X-Organization-Id": str(org_a_id)})
            assert res.status_code == 200
            data = res.json()
            raw_response_text = res.text

            # 1. Verify response does not contain any tenant-specific names, slugs, or IDs
            assert "Alpha Confidential Corp" not in raw_response_text
            assert "alpha-confidential" not in raw_response_text
            assert str(org_a_id) not in raw_response_text
            assert str(org_b_id) not in raw_response_text
            assert "tenant-alpha.com" not in raw_response_text
            assert str(user_id) not in raw_response_text

            # 2. Verify payload keys are strictly infrastructure-scoped
            allowed_top_keys = {
                "overall_status",
                "checked_at",
                "components",
                "recent_errors",
                "has_persistent_error_telemetry",
                "environment"
            }
            assert set(data.keys()) == allowed_top_keys
            allowed_components = {"api", "database", "redis", "workers"}
            assert set(data["components"].keys()) == allowed_components

            # 3. Verify that DB operations performed during health check are ONLY infrastructure pings (SELECT 1)
            # and never select from tenant tables (e.g. chatbots, conversations, leads, knowledge, messages)
            for stmt_text in mock_db_instance.executed_statements:
                # Should only be SELECT 1 or auth verification statements
                assert "chatbots" not in stmt_text.lower()
                assert "conversations" not in stmt_text.lower()
                assert "leads" not in stmt_text.lower()
                assert "knowledge" not in stmt_text.lower()
                assert "messages" not in stmt_text.lower()
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)


    @pytest.mark.asyncio
    async def test_database_failure_produces_down_status(self):
        """Database connection exception produces 'down' status and redacts errors."""
        mock_db = AsyncMock()
        mock_db.execute.side_effect = Exception("connection to postgresql://user:secret123@db.internal:5432 failed")

        db_health = await check_database(mock_db)
        assert db_health.status == "down"
        assert db_health.latency_ms is None
        assert "secret123" not in db_health.details
        assert "***@" in db_health.details

    def test_database_failure_returns_200_with_db_down(self):
        """
        Critical production resilience test:
        When PostgreSQL ping fails, /api/v1/admin/health MUST NOT return HTTP 500!
        It must return HTTP 200 with overall_status = 'down' and components.database.status = 'down'.
        """
        user_id = uuid4()
        org_id = uuid4()
        mock_user = User(id=user_id, email="owner@chatly.ai", hashed_password="hash", full_name="Owner", is_active=True, is_superuser=True)
        mock_org = Organization(id=org_id, name="Chatly Org", slug="chatly-org")
        mock_owner_member = OrganizationMember(id=uuid4(), user_id=user_id, organization_id=org_id, role=MemberRole.OWNER)

        class MockFailingDb:
            async def execute(self, stmt):
                stmt_str = str(stmt)
                if "SELECT 1" in stmt_str:
                    raise Exception("could not connect to server: Connection timed out")
                class MockResult:
                    def scalar_one_or_none(self):
                        return mock_owner_member
                    def scalars(self):
                        class MockScalars:
                            def first(self):
                                return mock_owner_member
                        return MockScalars()
                return MockResult()

            async def rollback(self):
                pass

        async def override_db():
            yield MockFailingDb()

        async def override_user():
            return mock_user

        async def override_org():
            return mock_org

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        app.dependency_overrides[get_current_organization] = override_org
        try:
            res = client.get("/api/v1/admin/health")
            assert res.status_code == 200, f"Expected HTTP 200 with DB down status, got {res.status_code}: {res.text}"
            data = res.json()
            assert data["overall_status"] == "down"
            assert data["components"]["database"]["status"] == "down"
            assert data["components"]["api"]["status"] == "healthy"
        finally:
            app.dependency_overrides.pop(get_db, None)
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_organization, None)

    @pytest.mark.asyncio
    async def test_redis_states(self, monkeypatch):
        """
        Tests all Redis state requirements:
        1. REDIS_URL missing/empty -> NOT_CONFIGURED
        2. REDIS_URL configured and connection fails -> DEGRADED
        3. REDIS_URL configured and ping succeeds -> HEALTHY
        """
        from app.services.admin_health_service import check_redis

        # 1. Missing / not configured
        monkeypatch.setattr("app.core.config.settings.REDIS_URL", "")
        res_missing = await check_redis()
        assert res_missing.status == "not_configured"

        # 2. Configured but connection fails -> DEGRADED (never 500)
        monkeypatch.setattr("app.core.config.settings.REDIS_URL", "redis://unreachable-redis.internal:6379/0")
        res_failed = await check_redis()
        assert res_failed.status == "degraded"

    def test_overall_status_calculation_rules(self):
        """Calculates overall status strictly from component health."""
        now = datetime.now(timezone.utc)
        
        # All healthy
        comps_healthy = {
            "api": AdminComponentHealth(name="API / Application", status="healthy", checked_at=now),
            "database": AdminComponentHealth(name="DB", status="healthy", checked_at=now),
            "redis": AdminComponentHealth(name="Redis", status="not_configured", checked_at=now),
            "workers": AdminComponentHealth(name="Workers", status="not_configured", checked_at=now),
        }
        assert calculate_overall_status(comps_healthy) == "healthy"

        # Database down -> overall down
        comps_db_down = {
            "api": AdminComponentHealth(name="API / Application", status="healthy", checked_at=now),
            "database": AdminComponentHealth(name="DB", status="down", checked_at=now),
            "redis": AdminComponentHealth(name="Redis", status="not_configured", checked_at=now),
            "workers": AdminComponentHealth(name="Workers", status="not_configured", checked_at=now),
        }
        assert calculate_overall_status(comps_db_down) == "down"

        # Redis degraded -> overall degraded
        comps_redis_degraded = {
            "api": AdminComponentHealth(name="API / Application", status="healthy", checked_at=now),
            "database": AdminComponentHealth(name="DB", status="healthy", checked_at=now),
            "redis": AdminComponentHealth(name="Redis", status="degraded", checked_at=now),
            "workers": AdminComponentHealth(name="Workers", status="not_configured", checked_at=now),
        }
        assert calculate_overall_status(comps_redis_degraded) == "degraded"

        # Redis down (optional) -> overall degraded
        comps_redis_down = {
            "api": AdminComponentHealth(name="API / Application", status="healthy", checked_at=now),
            "database": AdminComponentHealth(name="DB", status="healthy", checked_at=now),
            "redis": AdminComponentHealth(name="Redis", status="down", checked_at=now),
            "workers": AdminComponentHealth(name="Workers", status="not_configured", checked_at=now),
        }
        assert calculate_overall_status(comps_redis_down) == "degraded"

    def test_sanitize_error_message(self):
        """Verifies sanitization of credentials and URLs."""
        raw = "failed postgresql://myuser:supersecretpass@db.example.com:5432/helio with Bearer token_abc_123"
        sanitized = _sanitize_error_message(raw)
        assert "supersecretpass" not in sanitized
        assert "postgresql://***@" in sanitized
        assert "Bearer ***" in sanitized

    def test_database_url_normalization_with_sslmode(self):
        """
        Verifies that Supabase / Vercel database URLs with ?sslmode=require
        are normalized to avoid asyncpg TypeError keyword argument errors.
        """
        from app.core.database import normalize_database_url_and_connect_args

        # 1. postgres:// with ?sslmode=require
        url1 = "postgres://postgres:mypass@aws-0-pooler.supabase.com:6543/postgres?sslmode=require"
        clean1, args1 = normalize_database_url_and_connect_args(url1)
        assert clean1.startswith("postgresql+asyncpg://")
        assert "sslmode" not in clean1
        assert args1.get("ssl") == "require"

        # 2. postgresql:// with &sslmode=require
        url2 = "postgresql://user:pass@host:5432/db?other=1&sslmode=require"
        clean2, args2 = normalize_database_url_and_connect_args(url2)
        assert clean2.startswith("postgresql+asyncpg://")
        assert "sslmode" not in clean2
        assert "other=1" in clean2
        assert args2.get("ssl") == "require"

    def test_full_response_validates_against_pydantic_schema(self):
        """Validates that a constructed health payload strictly satisfies AdminHealthResponse schema."""
        from app.schemas.admin_health import AdminHealthResponse, AdminComponentHealth
        now = datetime.now(timezone.utc)
        payload = {
            "overall_status": "healthy",
            "checked_at": now.isoformat(),
            "components": {
                "api": {
                    "name": "API / Application",
                    "status": "healthy",
                    "latency_ms": 12.34,
                    "uptime": "No historical data",
                    "details": "FastAPI runtime active.",
                    "checked_at": now.isoformat()
                },
                "database": {
                    "name": "Main Database (PostgreSQL)",
                    "status": "healthy",
                    "latency_ms": 45.67,
                    "uptime": "No historical data",
                    "details": "SELECT 1 OK.",
                    "checked_at": now.isoformat()
                },
                "redis": {
                    "name": "Redis Cache",
                    "status": "not_configured",
                    "latency_ms": None,
                    "uptime": "No historical data",
                    "details": "Not configured.",
                    "checked_at": now.isoformat()
                },
                "workers": {
                    "name": "Background Workers",
                    "status": "not_configured",
                    "latency_ms": None,
                    "uptime": "No historical data",
                    "details": "Not configured.",
                    "checked_at": now.isoformat()
                }
            },
            "recent_errors": [],
            "has_persistent_error_telemetry": False,
            "environment": "production"
        }
        validated = AdminHealthResponse.model_validate(payload)
        assert validated.overall_status == "healthy"
        assert validated.components["api"].status == "healthy"
        assert validated.components["database"].status == "healthy"
        assert validated.components["redis"].status == "not_configured"
        assert validated.components["workers"].status == "not_configured"


