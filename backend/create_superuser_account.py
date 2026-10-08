import asyncio
import argparse
import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.auth_service import AuthService

async def create_superuser(email: str, password: str, full_name: str, org_name: str):
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User {email} not found. Creating new account...")
            req = RegisterRequest(
                email=email,
                password=password,
                full_name=full_name,
                organization_name=org_name
            )
            # Register user and create their primary organization
            user, org, access_token, refresh_token = await AuthService.register(db, req)
            print(f"Created workspace: {org.name}")
        else:
            print(f"User {email} already exists.")
        
        # Promote to superuser
        if user.platform_role != "super_user":
            user.platform_role = "super_user"
            db.add(user)
            await db.commit()
            print(f"Successfully promoted {email} to System Owner (superuser)!")
        else:
            print(f"User {email} is already a superuser.")

def main():
    parser = argparse.ArgumentParser(description="Create a test superuser.")
    parser.add_argument("--email", type=str, default="admin@helio.com", help="Email for the test user")
    parser.add_argument("--password", type=str, default="admin1234", help="Password for the test user")
    parser.add_argument("--name", type=str, default="Helio Admin", help="Full name")
    parser.add_argument("--org", type=str, default="Helio Test Workspace", help="Organization name")
    
    args = parser.parse_args()
    asyncio.run(create_superuser(args.email, args.password, args.name, args.org))

if __name__ == "__main__":
    main()
