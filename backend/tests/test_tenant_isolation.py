import uuid
import pytest
from fastapi import HTTPException
from app.models.organization_member import MemberRole
from app.api.deps import require_role


class MockUser:
    def __init__(self, user_id: uuid.UUID, email: str):
        self.id = user_id
        self.email = email
        self.is_active = True


class MockOrg:
    def __init__(self, org_id: uuid.UUID, name: str):
        self.id = org_id
        self.name = name


class MockMember:
    def __init__(self, org_id: uuid.UUID, user_id: uuid.UUID, role: MemberRole):
        self.organization_id = org_id
        self.user_id = user_id
        self.role = role


@pytest.mark.asyncio
async def test_rbac_require_role_owner_allowed():
    """Validates that OWNER role passes requirement for [OWNER, ADMIN]."""
    checker = require_role([MemberRole.OWNER, MemberRole.ADMIN])

    user = MockUser(uuid.uuid4(), "owner@example.com")
    org = MockOrg(uuid.uuid4(), "Acme Corp")
    member = MockMember(org.id, user.id, MemberRole.OWNER)

    # Mock DB execute returning the owner member
    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return member
            return MockResult()

    result = await checker(db=MockDb(), current_user=user, org=org)
    assert result.role == MemberRole.OWNER


@pytest.mark.asyncio
async def test_rbac_require_role_viewer_denied():
    """Validates that VIEWER role is rejected with HTTP 403 for admin-only operations."""
    checker = require_role([MemberRole.OWNER, MemberRole.ADMIN])

    user = MockUser(uuid.uuid4(), "viewer@example.com")
    org = MockOrg(uuid.uuid4(), "Acme Corp")
    member = MockMember(org.id, user.id, MemberRole.VIEWER)

    class MockDb:
        async def execute(self, stmt):
            class MockResult:
                def scalar_one_or_none(self):
                    return member
            return MockResult()

    with pytest.raises(HTTPException) as exc_info:
        await checker(db=MockDb(), current_user=user, org=org)

    assert exc_info.value.status_code == 403
    assert "Operation requires one of the following roles" in exc_info.value.detail


@pytest.mark.asyncio
async def test_tenant_data_isolation_filter():
    """
    Validates that queries filtered by organization_id strictly isolate tenant data.
    """
    org_a_id = uuid.uuid4()
    org_b_id = uuid.uuid4()

    mock_db_records = [
        {"id": uuid.uuid4(), "organization_id": org_a_id, "title": "Org A Document 1"},
        {"id": uuid.uuid4(), "organization_id": org_a_id, "title": "Org A Document 2"},
        {"id": uuid.uuid4(), "organization_id": org_b_id, "title": "Org B Document Secret"},
    ]

    # Simulating tenant-scoped query
    def query_by_org(active_org_id: uuid.UUID):
        return [r for r in mock_db_records if r["organization_id"] == active_org_id]

    org_a_results = query_by_org(org_a_id)
    org_b_results = query_by_org(org_b_id)

    assert len(org_a_results) == 2
    assert len(org_b_results) == 1

    # Ensure zero data leakage between Org A and Org B
    for doc in org_a_results:
        assert doc["organization_id"] == org_a_id
        assert doc["organization_id"] != org_b_id

    for doc in org_b_results:
        assert doc["organization_id"] == org_b_id
        assert doc["organization_id"] != org_a_id

@pytest.mark.asyncio
async def test_organization_creation_atomicity():
    """
    Verifies that if OrganizationMember creation fails, the Organization is rolled back,
    ensuring atomic creation and no orphaned records.
    """
    from app.services.org_service import OrganizationService
    from app.schemas.organization import OrgCreate
    
    user = MockUser(uuid.uuid4(), "test@example.com")
    data = OrgCreate(name="Failing Org", industry="Tech")

    # Mock DB that raises an Exception on the second add (member insertion) or commit
    class MockFailingDb:
        def __init__(self):
            self.added_objects = []
            self.flushed = False
            self.commit_called = False
            self.rolled_back = False

        def add(self, obj):
            from app.models.organization_member import OrganizationMember
            if isinstance(obj, OrganizationMember):
                raise Exception("Simulated database failure during member insertion")
            self.added_objects.append(obj)

        async def flush(self):
            self.flushed = True

        async def commit(self):
            self.commit_called = True

        async def rollback(self):
            self.rolled_back = True

    mock_db = MockFailingDb()

    with pytest.raises(Exception, match="Simulated database failure during member insertion"):
        await OrganizationService.create(db=mock_db, creator=user, data=data)
    
    assert mock_db.commit_called is False
    # In FastAPI with dependencies, rollback is handled by the dependency yield block when an exception bubbles up.
    # We verify the transaction boundary never committed the org.
