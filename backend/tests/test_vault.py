import pytest
from app.core.vault import encrypt_vault_secret, decrypt_vault_secret


def test_vault_encrypt_and_decrypt():
    secret = "ya29.a0AfH6SMDh_fake_google_oauth_refresh_token_12345"
    encrypted = encrypt_vault_secret(secret)
    assert encrypted != secret
    decrypted = decrypt_vault_secret(encrypted)
    assert decrypted == secret


def test_vault_tampered_payload_rejection():
    secret = "sensitive_api_key_secret_value"
    encrypted = encrypt_vault_secret(secret)
    # Tamper with the encrypted string
    tampered = encrypted[:-4] + "AAAA"
    with pytest.raises(ValueError) as exc_info:
        decrypt_vault_secret(tampered)
    assert "Vault decryption failed" in str(exc_info.value)


def test_vault_custom_key_support():
    custom_key = b"12345678901234567890123456789012"  # 32 bytes
    secret = "custom_vault_token"
    encrypted = encrypt_vault_secret(secret, custom_key=custom_key)
    decrypted = decrypt_vault_secret(encrypted, custom_key=custom_key)
    assert decrypted == secret

    # Decrypting with wrong key fails
    wrong_key = b"abcdefghijklmnopqrstuvwxyz123456"
    with pytest.raises(ValueError):
        decrypt_vault_secret(encrypted, custom_key=wrong_key)


def test_vault_secret_key_from_env(monkeypatch):
    monkeypatch.setattr("app.core.vault.settings.VAULT_SECRET_KEY", "dedicated_super_secret_vault_encryption_key_32_chars!")
    secret = "oauth_token_with_custom_env_vault_key"
    encrypted = encrypt_vault_secret(secret)
    decrypted = decrypt_vault_secret(encrypted)
    assert decrypted == secret


def test_vault_production_rejects_default_dev_key(monkeypatch):
    monkeypatch.setattr("app.core.vault.settings.ENVIRONMENT", "production")
    monkeypatch.setattr("app.core.vault.settings.VAULT_SECRET_KEY", None)
    monkeypatch.setattr("app.core.vault.settings.SECRET_KEY", "super-secret-development-key-change-in-production-min-32-chars-long")
    with pytest.raises(ValueError, match="CRITICAL SECURITY CONFIGURATION ERROR"):
        encrypt_vault_secret("any_token")

