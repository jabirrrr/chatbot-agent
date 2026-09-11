import secrets
import hashlib
import uuid
from typing import Tuple, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.api_key import ApiKey


def hash_api_key(key: str) -> str:
    """Computes SHA-256 hash of API key for secure database persistence."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


class ApiKeyService:
    @staticmethod
    def create_key_pair(
        name: str,
        organization_id: uuid.UUID,
        scopes: Optional[List[str]] = None
    ) -> Tuple[str, ApiKey]:
        """
        Generates a new API key pair: returns (plaintext_key, api_key_model).
        The plaintext_key is displayed only once to the user upon creation.
        Fulfills REQ-INT-03.
        """
        raw_secret = secrets.token_urlsafe(32)
        plaintext = f"cba_live_{raw_secret}"
        prefix = plaintext[:16]
        hashed = hash_api_key(plaintext)

        api_key_obj = ApiKey(
            organization_id=organization_id,
            name=name,
            prefix=prefix,
            hashed_key=hashed,
            scopes=scopes or ["leads:read", "leads:write", "conversations:read", "analytics:read"],
            is_active=True
        )
        return plaintext, api_key_obj

    @staticmethod
    async def verify_key(
        db: AsyncSession,
        plaintext_key: str
    ) -> Optional[ApiKey]:
        """
        Looks up API key by SHA-256 hash. Updates last_used_at timestamp.
        """
        hashed = hash_api_key(plaintext_key)
        stmt = select(ApiKey).where(
            ApiKey.hashed_key == hashed,
            ApiKey.is_active == True
        )
        result = await db.execute(stmt)
        key_record = result.scalar_one_or_none()
        if key_record:
            key_record.last_used_at = datetime.now(timezone.utc)
            await db.commit()
        return key_record
