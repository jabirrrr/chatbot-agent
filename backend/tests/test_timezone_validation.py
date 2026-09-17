import pytest
from pydantic import ValidationError
import zoneinfo
from app.schemas.organization import OrgUpdate, OrgBase, validate_iana_timezone
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.models.user import User
from uuid import uuid4

client = TestClient(app)


class TestTimezoneValidation:
    def test_validate_iana_timezone_valid_canonical(self):
        """Test that canonical IANA timezone strings are accepted."""
        assert validate_iana_timezone("Asia/Kolkata") == "Asia/Kolkata"
        assert validate_iana_timezone("America/New_York") == "America/New_York"
        assert validate_iana_timezone("Europe/London") == "Europe/London"
        assert validate_iana_timezone("UTC") == "UTC"
        assert validate_iana_timezone("Australia/Sydney") == "Australia/Sydney"
        assert validate_iana_timezone("Pacific/Auckland") == "Pacific/Auckland"

    def test_validate_iana_timezone_normalizes_legacy_format(self):
        """Test that legacy descriptive format strings are normalized to canonical IANA."""
        assert validate_iana_timezone("America/Chicago (CST - UTC-6)") == "America/Chicago"
        assert validate_iana_timezone("America/New_York (EST - UTC-5)") == "America/New_York"
        assert validate_iana_timezone("Asia/Kolkata (IST - UTC+5:30)") == "Asia/Kolkata"

    def test_validate_iana_timezone_rejects_invalid(self):
        """Test that invalid timezone strings are strictly rejected."""
        with pytest.raises(ValueError) as exc:
            validate_iana_timezone("Fake/Timezone_Not_Real")
        assert "is not a valid IANA timezone identifier" in str(exc.value)

        with pytest.raises(ValueError) as exc:
            validate_iana_timezone("Atlantis/Ocean")
        assert "is not a valid IANA timezone identifier" in str(exc.value)

    def test_org_update_schema_accepts_valid_timezone(self):
        """Test that OrgUpdate schema accepts valid IANA timezones."""
        update = OrgUpdate(timezone="Asia/Kolkata")
        assert update.timezone == "Asia/Kolkata"

        update_legacy = OrgUpdate(timezone="America/Denver (MST - UTC-7)")
        assert update_legacy.timezone == "America/Denver"

    def test_org_update_schema_rejects_invalid_timezone(self):
        """Test that OrgUpdate schema raises ValidationError on invalid timezones."""
        with pytest.raises(ValidationError):
            OrgUpdate(timezone="Not/A_Valid_Zone")

    def test_zoneinfo_resolution(self):
        """Test that Python zoneinfo resolves the validated canonical strings without error."""
        for tz_str in ["Asia/Kolkata", "America/New_York", "Europe/London", "UTC"]:
            zi = zoneinfo.ZoneInfo(tz_str)
            assert zi is not None
            assert str(zi) == tz_str

    def test_update_organization_timezone_endpoint_rejects_invalid(self):
        """Test that organization update endpoint validates timezone and rejects invalid ones."""
        org_id = uuid4()
        user_id = uuid4()

        mock_user = User(
            id=user_id,
            email="admin@acme.com",
            hashed_password="fakehash_argon2id",
            full_name="Admin User",
            is_active=True,
            is_verified=True
        )

        async def override_user():
            return mock_user

        app.dependency_overrides[get_current_user] = override_user
        try:
            res = client.put(
                f"/api/v1/organizations/{org_id}",
                json={"timezone": "Invalid/Zone_XYZ"}
            )
            # Schema validation happens before DB lookup, returns 422
            assert res.status_code == 422
            detail = res.json()["detail"]
            assert any("Invalid IANA timezone identifier" in str(d) or "is not a valid IANA timezone identifier" in str(d) for d in detail)
        finally:
            app.dependency_overrides.pop(get_current_user, None)
