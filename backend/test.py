import asyncio
from app.core.database import AsyncSessionLocal
from app.services.platform_integration_service import get_integrations

async def test_integrations():
    async with AsyncSessionLocal() as db:
        res = await get_integrations(db)
        print(res)

if __name__ == '__main__':
    asyncio.run(test_integrations())
