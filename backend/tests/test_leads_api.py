import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.lead import Lead

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_lead_id = uuid.uuid4()
mock_conv_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="operator@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Alice Operator",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Acme Corp",
    slug="acme-corp"
)

mock_lead = Lead(
    id=mock_lead_id,
    organization_id=mock_org_id,
    conversation_id=mock_conv_id,
    name="Jane Doe",
    email="jane.doe@enterprise.com",
    phone="+1-555-0199",
    status="qualified",
    notes="Interested in 50 seats annual license",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionLeads:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                return mock_lead

            def scalar(self):
                return 1

            def scalars(self):
                class MockScalars:
                    def all(self):
                        return [mock_lead]
                    def first(self):
                        return mock_lead
                return MockScalars()

        return MockResult()

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_list_leads_unauthorized():
    response = client.get("/api/v1/leads/")
    assert response.status_code == 401


def test_list_leads_with_filter():
    async def override_get_db():
        yield MockDbSessionLeads()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/leads/?status=qualified&search=Jane")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Jane Doe"
    assert data["items"][0]["email"] == "jane.doe@enterprise.com"


def test_get_single_lead():
    async def override_get_db():
        yield MockDbSessionLeads()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get(f"/api/v1/leads/{mock_lead_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(mock_lead_id)
    assert data["status"] == "qualified"


def test_update_lead_status_and_notes():
    async def override_get_db():
        yield MockDbSessionLeads()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.patch(
        f"/api/v1/leads/{mock_lead_id}",
        json={"status": "converted", "notes": "Contract signed"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "converted"


def test_export_leads_csv_streaming():
    async def override_get_db():
        yield MockDbSessionLeads()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/leads/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    csv_text = response.text
    assert "ID,Created At,Name,Email,Phone,Status,Notes" in csv_text
    assert "Jane Doe" in csv_text
    assert "jane.doe@enterprise.com" in csv_text
