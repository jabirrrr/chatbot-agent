import uuid
import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import MagicMock

from app.main import app
from app.core.database import get_db
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.api.v1.widget import parse_allowed_domains, verify_domain_authorization

client = TestClient(app)

mock_bot_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_token = "wgt_domain_test_token"

def test_parse_allowed_domains_formats():
    """Validates domain parsing across single, multiple, and list formats."""
    assert parse_allowed_domains(None) == []
    assert parse_allowed_domains("") == []
    assert parse_allowed_domains("   ") == []

    # Single domain
    assert parse_allowed_domains("example.com") == ["example.com"]
    assert parse_allowed_domains("https://example.com/some/path") == ["example.com"]

    # Comma-separated multi-domain
    multi = parse_allowed_domains("company.com, app.staging.io, http://localhost:3000")
    assert "company.com" in multi
    assert "app.staging.io" in multi
    assert "localhost" in multi

    # List format
    list_input = ["https://site1.com", "site2.org"]
    assert parse_allowed_domains(list_input) == ["site1.com", "site2.org"]

def test_verify_domain_authorization_logic():
    """Validates strict boundary matching and rejection of malicious lookalikes."""
    bot = MagicMock(spec=Chatbot)
    bot.config_json = {"domain": "trusted.com"}

    # Exact match via Origin
    req_exact = MagicMock()
    req_exact.headers = {"origin": "https://trusted.com"}
    verify_domain_authorization(bot, req_exact)  # Should not raise

    # Subdomain match via Referer
    req_sub = MagicMock()
    req_sub.headers = {"referer": "https://app.trusted.com/dashboard"}
    verify_domain_authorization(bot, req_sub)  # Should not raise

    # Nested subdomain
    req_nested = MagicMock()
    req_nested.headers = {"origin": "https://admin.portal.trusted.com"}
    verify_domain_authorization(bot, req_nested)  # Should not raise

    # Lookalike / Hyphenated domain attack -> MUST raise 403
    req_evil = MagicMock()
    req_evil.headers = {"origin": "https://evil-trusted.com"}
    with pytest.raises(HTTPException) as exc_info:
        verify_domain_authorization(bot, req_evil)
    assert exc_info.value.status_code == 403

    # Suffix attack -> MUST raise 403
    req_suffix = MagicMock()
    req_suffix.headers = {"origin": "https://trusted.com.attacker.com"}
    with pytest.raises(HTTPException) as exc_info:
        verify_domain_authorization(bot, req_suffix)
    assert exc_info.value.status_code == 403

    # Missing origin & referer on restricted bot -> MUST raise 403
    req_empty = MagicMock()
    req_empty.headers = {}
    with pytest.raises(HTTPException) as exc_info:
        verify_domain_authorization(bot, req_empty)
    assert exc_info.value.status_code == 403

    # Unrestricted bot allows any origin
    bot_unrestricted = MagicMock(spec=Chatbot)
    bot_unrestricted.config_json = {"domain": ""}
    req_any = MagicMock()
    req_any.headers = {"origin": "https://anywhere.org"}
    verify_domain_authorization(bot_unrestricted, req_any)  # Should not raise

def test_cors_options_preflight_on_widget_session():
    """Ensures third-party host sites receive valid CORS headers on OPTIONS preflight."""
    response = client.options(
        "/api/v1/widget/session",
        headers={
            "Origin": "https://customer-website.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ["https://customer-website.com", "*"]
    assert "POST" in response.headers.get("access-control-allow-methods", "")
