import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

DEMO_EMAIL = "demo-admin@helio.com"
DEMO_NAME = "Demo Admin"
# For reviewer access, we assume a standard demo password or one provided via env.
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo1234")

async def initialize_demo_user():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == DEMO_EMAIL))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"[*] Found existing demo user: {DEMO_EMAIL}")
            if user.full_name != DEMO_NAME:
                print(f"[*] Updating full_name from '{user.full_name}' to '{DEMO_NAME}'...")
                user.full_name = DEMO_NAME
                await session.commit()
                print("[+] Successfully updated demo user.")
            else:
                print("[*] Demo user full_name is already correct. No changes made.")
        else:
            print(f"[*] Demo user not found. Creating {DEMO_EMAIL}...")
            new_user = User(
                email=DEMO_EMAIL,
                full_name=DEMO_NAME,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                is_active=True,
                is_verified=True, 
                platform_role="super_user"
            )
            session.add(new_user)
            await session.commit()
            print("[+] Successfully created demo user.")

if __name__ == "__main__":
    asyncio.run(initialize_demo_user())
