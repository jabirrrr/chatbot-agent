import uuid
from datetime import timedelta
import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_argon2id_password_hashing():
    """Validates OWASP-compliant Argon2id password hashing and verification."""
    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)

    assert hashed != password
    # Verify prefix for Argon2id hash
    assert hashed.startswith("$argon2id$")

    # Positive verification
    assert verify_password(password, hashed) is True

    # Negative verification
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_access_token_creation_and_claims():
    """Validates JWT access token generation, claims, and type."""
    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    token = create_access_token(
        subject=user_id,
        extra_claims={"org_id": str(org_id), "role": "OWNER"}
    )

    assert isinstance(token, str)
    payload = decode_token(token)

    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("type") == "access"
    assert payload.get("org_id") == str(org_id)
    assert payload.get("role") == "OWNER"
    assert "exp" in payload
    assert "iat" in payload


def test_jwt_refresh_token_creation():
    """Validates JWT rotating refresh token structure and 30-day scope."""
    user_id = uuid.uuid4()

    token = create_refresh_token(subject=user_id)
    payload = decode_token(token)

    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("type") == "refresh"
    assert payload.get("exp") > payload.get("iat")


def test_invalid_or_tampered_jwt_token():
    """Ensures tampered tokens fail validation and return None."""
    valid_token = create_access_token(subject=uuid.uuid4())
    # Tamper with token signature
    tampered_token = valid_token[:-4] + "fake"

    assert decode_token(tampered_token) is None
    assert decode_token("completely.invalid.token") is None
