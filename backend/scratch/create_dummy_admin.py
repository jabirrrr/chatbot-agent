import sys
sys.path.insert(0, ".")

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.auth_service import AuthService
from app.core.security import get_password_hash

async def create_dummy_admin():
    email = "admin@helio.com"
    password = "HelioAdmin123!"
    
    async with AsyncSessionLocal() as db:
        # Check if already exists
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User {email} already exists.")
            user.is_superuser = True
            user.hashed_password = get_password_hash(password)
            db.add(user)
            await db.commit()
            print("Updated superuser status and password.")
            return

        # Register new user
        req = RegisterRequest(
            email=email,
            password=password,
            full_name="Helio Admin",
            organization_name="Helio HQ"
        )
        try:
            user, org, access_token, refresh_token = await AuthService.register(db, req)
            user.is_superuser = True
            db.add(user)
            await db.commit()
            print(f"Successfully created admin user: {email} with password: {password}")
        except Exception as e:
            print(f"Failed to create user: {e}")

if __name__ == "__main__":
    asyncio.run(create_dummy_admin())
