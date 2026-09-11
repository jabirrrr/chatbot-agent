import os
import base64
import hashlib
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def _derive_vault_key(secret: Optional[str] = None) -> bytes:
    """
    Derives a 256-bit AES key from the system secret key using SHA-256.
    """
    base_secret = secret or settings.SECRET_KEY
    return hashlib.sha256(base_secret.encode("utf-8")).digest()


def encrypt_vault_secret(plaintext: str, custom_key: Optional[bytes] = None) -> str:
    """
    Encrypts a plaintext secret using AES-256-GCM with a random 96-bit nonce.
    Returns URL-safe Base64-encoded string containing [12-byte nonce + ciphertext + 16-byte tag].
    Fulfills REQ-INT-01.
    """
    key = custom_key or _derive_vault_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    payload = nonce + ciphertext
    return base64.urlsafe_b64encode(payload).decode("utf-8")


def decrypt_vault_secret(encrypted_b64: str, custom_key: Optional[bytes] = None) -> str:
    """
    Decrypts an AES-256-GCM encrypted payload.
    Raises ValueError if decryption or authentication fails (tampering detected).
    """
    try:
        payload = base64.urlsafe_b64decode(encrypted_b64.encode("utf-8"))
        if len(payload) < 28:  # 12 bytes nonce + 16 bytes auth tag minimum
            raise ValueError("Invalid encrypted payload length")

        nonce = payload[:12]
        ciphertext = payload[12:]
        key = custom_key or _derive_vault_key()
        aesgcm = AESGCM(key)
        plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext_bytes.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Vault decryption failed or secret tampered: {str(e)}") from e
