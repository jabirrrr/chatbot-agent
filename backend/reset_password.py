import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select
from app.core.security import get_password_hash

async def reset_pwd():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email=='demo-admin@helio.com'))).scalar_one()
        user.hashed_password = get_password_hash('admin1234')
        await db.commit()
        print('Password reset!')

asyncio.run(reset_pwd())
