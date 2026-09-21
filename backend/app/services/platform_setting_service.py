from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.platform_setting import PlatformSetting
from app.schemas.platform_setting import PlatformSettingUpdate, PlatformSettingResponse

async def get_platform_settings(db: AsyncSession) -> PlatformSetting:
    stmt = select(PlatformSetting).where(PlatformSetting.id == 1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create default if not exists
        settings = PlatformSetting(
            id=1,
            allow_signups=True,
            max_tenants_allowed=1000,
            maintenance_mode=False,
            maintenance_message="System is under maintenance. Please check back later."
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings

async def update_platform_settings(
    db: AsyncSession,
    settings_in: PlatformSettingUpdate
) -> PlatformSetting:
    settings = await get_platform_settings(db)
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
        
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings
