import json
import uuid
import time
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.integration import TenantIntegration
from app.core.vault import encrypt_vault_secret, decrypt_vault_secret
from app.adapters.calendar.google_calendar import GoogleCalendarService


class IntegrationService:
    """
    Manages tenant integrations, encrypted credentials vault (AES-256-GCM),
    and automatic token refresh.
    """

    @staticmethod
    async def get_integration(
        db: AsyncSession,
        organization_id: uuid.UUID,
        provider: str = "google_calendar"
    ) -> Optional[TenantIntegration]:
        stmt = select(TenantIntegration).where(
            TenantIntegration.organization_id == organization_id,
            TenantIntegration.provider == provider
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def save_integration(
        db: AsyncSession,
        organization_id: uuid.UUID,
        provider: str,
        credentials: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> TenantIntegration:
        """
        Encrypts credentials payload and upserts record into tenant_integrations.
        """
        # Add timestamp of when token was stored/expires
        if "stored_at" not in credentials:
            credentials["stored_at"] = int(time.time())

        plaintext_json = json.dumps(credentials)
        encrypted_data = encrypt_vault_secret(plaintext_json)

        existing = await IntegrationService.get_integration(db, organization_id, provider)
        if existing:
            existing.encrypted_credentials = encrypted_data
            existing.status = "connected"
            if metadata:
                existing.metadata_json = metadata
            existing.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return existing

        integration = TenantIntegration(
            organization_id=organization_id,
            provider=provider,
            encrypted_credentials=encrypted_data,
            status="connected",
            metadata_json=metadata or {}
        )
        db.add(integration)
        await db.commit()
        await db.refresh(integration)
        return integration

    @staticmethod
    async def disconnect_integration(
        db: AsyncSession,
        organization_id: uuid.UUID,
        provider: str = "google_calendar"
    ) -> bool:
        """
        Revokes token with provider and deletes stored integration record.
        """
        integration = await IntegrationService.get_integration(db, organization_id, provider)
        if not integration:
            return True

        # Attempt token revocation
        try:
            creds_json = decrypt_vault_secret(integration.encrypted_credentials)
            creds = json.loads(creds_json)
            token_to_revoke = creds.get("refresh_token") or creds.get("access_token")
            if token_to_revoke and provider == "google_calendar":
                await GoogleCalendarService.revoke_token(token_to_revoke)
        except Exception:
            pass

        # Remove from database
        await db.delete(integration)
        await db.commit()
        return True

    @staticmethod
    async def get_valid_access_token(
        db: AsyncSession,
        organization_id: uuid.UUID,
        provider: str = "google_calendar"
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieves decrypted access token. If token is expired and refresh_token exists,
        refreshes access token and saves back to vault.
        Returns: (access_token, error_message)
        """
        integration = await IntegrationService.get_integration(db, organization_id, provider)
        if not integration:
            return None, "Integration is not connected"

        if integration.status != "connected":
            return None, f"Integration status is {integration.status}"

        try:
            creds_json = decrypt_vault_secret(integration.encrypted_credentials)
            creds = json.loads(creds_json)
        except Exception as e:
            integration.status = "needs_reconnect"
            await db.commit()
            return None, f"Failed to decrypt credentials: {str(e)}"

        access_token = creds.get("access_token")
        refresh_token = creds.get("refresh_token")
        expires_in = creds.get("expires_in", 3600)
        stored_at = creds.get("stored_at", 0)

        # Check if token is close to expiry (within 5 minutes)
        now_ts = int(time.time())
        is_expired = (now_ts - stored_at) >= (expires_in - 300)

        if is_expired and refresh_token:
            try:
                refreshed = await GoogleCalendarService.refresh_access_token(refresh_token)
                new_access_token = refreshed.get("access_token")
                if new_access_token:
                    creds["access_token"] = new_access_token
                    creds["stored_at"] = now_ts
                    if "expires_in" in refreshed:
                        creds["expires_in"] = refreshed["expires_in"]
                    
                    integration.encrypted_credentials = encrypt_vault_secret(json.dumps(creds))
                    integration.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                    return new_access_token, None
            except Exception as e:
                integration.status = "needs_reconnect"
                await db.commit()
                return None, f"Token refresh failed: {str(e)}"

        if access_token:
            return access_token, None

        return None, "No valid access token available"

    @staticmethod
    async def get_all_statuses(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Returns connection status summary for dashboard integrations.
        """
        stmt = select(TenantIntegration).where(
            TenantIntegration.organization_id == organization_id
        )
        result = await db.execute(stmt)
        integrations = list(result.scalars().all())

        status_map: Dict[str, Any] = {}
        for item in integrations:
            status_map[item.provider] = {
                "connected": item.status == "connected",
                "status": item.status,
                "metadata": item.metadata_json or {},
                "updated_at": item.updated_at.isoformat() if item.updated_at else None
            }

        # Default google_calendar if not present
        if "google_calendar" not in status_map:
            status_map["google_calendar"] = {
                "connected": False,
                "status": "disconnected",
                "metadata": {},
                "updated_at": None
            }

        return status_map
