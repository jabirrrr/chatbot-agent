from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.platform_integration import PlatformIntegration
from app.schemas.platform_integration import PlatformIntegrationCreate, PlatformIntegrationUpdate
from app.core.vault import encrypt_vault_secret

async def get_integrations(db: AsyncSession) -> List[PlatformIntegration]:
    stmt = select(PlatformIntegration).order_by(PlatformIntegration.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_integration_by_id(db: AsyncSession, integration_id: UUID) -> Optional[PlatformIntegration]:
    stmt = select(PlatformIntegration).where(PlatformIntegration.id == integration_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_integration_by_provider(db: AsyncSession, provider: str) -> Optional[PlatformIntegration]:
    stmt = select(PlatformIntegration).where(PlatformIntegration.provider == provider)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def create_integration(db: AsyncSession, integration_in: PlatformIntegrationCreate) -> PlatformIntegration:
    # Check for duplicate name
    stmt = select(PlatformIntegration).where(PlatformIntegration.name == integration_in.name)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integration with name '{integration_in.name}' already exists."
        )

    # Check for duplicate provider (provider uniqueness requirement)
    stmt = select(PlatformIntegration).where(PlatformIntegration.provider == integration_in.provider)
    existing_provider = (await db.execute(stmt)).scalar_one_or_none()
    if existing_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integration for provider '{integration_in.provider}' already exists."
        )

    encrypted = encrypt_vault_secret(integration_in.credentials)
    
    integration = PlatformIntegration(
        name=integration_in.name,
        provider=integration_in.provider,
        is_active=integration_in.is_active,
        encrypted_credentials=encrypted
    )
    
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return integration

async def update_integration_by_provider(
    db: AsyncSession,
    provider: str,
    integration_in: PlatformIntegrationUpdate
) -> PlatformIntegration:
    integration = await get_integration_by_provider(db, provider)
    if not integration:
        credentials = integration_in.credentials or ""
        encrypted = encrypt_vault_secret(credentials)
        
        integration = PlatformIntegration(
            name=integration_in.name or provider,
            provider=integration_in.provider or provider,
            is_active=integration_in.is_active if integration_in.is_active is not None else True,
            encrypted_credentials=encrypted
        )
        db.add(integration)
        await db.commit()
        await db.refresh(integration)
        return integration
        
    if integration_in.name is not None and integration_in.name != integration.name:
        stmt = select(PlatformIntegration).where(PlatformIntegration.name == integration_in.name)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Integration with name '{integration_in.name}' already exists."
            )
            
    # Also if provider changes, check uniqueness
    if integration_in.provider is not None and integration_in.provider != integration.provider:
        stmt = select(PlatformIntegration).where(PlatformIntegration.provider == integration_in.provider)
        existing_provider = (await db.execute(stmt)).scalar_one_or_none()
        if existing_provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Integration for provider '{integration_in.provider}' already exists."
            )

    update_data = integration_in.model_dump(exclude_unset=True)
    if "credentials" in update_data:
        credentials = update_data.pop("credentials")
        integration.encrypted_credentials = encrypt_vault_secret(credentials)
        
    for field, value in update_data.items():
        setattr(integration, field, value)
        
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return integration

async def delete_integration_by_provider(db: AsyncSession, provider: str) -> None:
    integration = await get_integration_by_provider(db, provider)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found."
        )
        
    await db.delete(integration)
    await db.commit()

# Preserve existing UUID-based functions for compatibility if required elsewhere
async def update_integration(
    db: AsyncSession,
    integration_id: UUID,
    integration_in: PlatformIntegrationUpdate
) -> PlatformIntegration:
    integration = await get_integration_by_id(db, integration_id)
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found.")
    return await update_integration_by_provider(db, integration.provider, integration_in)

async def delete_integration(db: AsyncSession, integration_id: UUID) -> None:
    integration = await get_integration_by_id(db, integration_id)
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found.")
    await delete_integration_by_provider(db, integration.provider)
