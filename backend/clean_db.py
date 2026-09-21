import asyncio
from app.core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE alembic_version SET version_num = '2c03f339e0b5';"))
        # Drop platform_settings and platform_integrations if they exist
        await conn.execute(text("DROP TABLE IF EXISTS platform_settings CASCADE;"))
        await conn.execute(text("DROP TABLE IF EXISTS platform_integrations CASCADE;"))

if __name__ == "__main__":
    asyncio.run(main())
