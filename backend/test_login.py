import asyncio
from app.core.database import AsyncSessionLocal
from app.services.auth_service import AuthService
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from sqlalchemy import select

async def test_login():
    async with AsyncSessionLocal() as db:
        print("Authenticating user...")
        user = await AuthService.authenticate(db, "demo-admin@helio.com", "admin1234")
        if not user:
            print("Auth failed: Invalid credentials")
            return
        
        print("User authenticated. Fetching orgs...")
        stmt = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user.id)
        )
        result = await db.execute(stmt)
        orgs = list(result.scalars().all())
        print(f"Fetched {len(orgs)} organizations.")
        print("Login flow successful.")

if __name__ == '__main__':
    asyncio.run(test_login())
