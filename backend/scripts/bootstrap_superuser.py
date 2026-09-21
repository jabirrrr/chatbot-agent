import asyncio
import argparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User

async def make_superuser(email: str):
    async with SessionLocal() as db:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return

        if user.is_superuser:
            print(f"User '{email}' is already a superuser.")
            return

        user.is_superuser = True
        db.add(user)
        await db.commit()
        print(f"Success! User '{email}' is now a System Owner (superuser).")

def main():
    parser = argparse.ArgumentParser(description="Promote an existing user to System Owner (superuser).")
    parser.add_argument("email", type=str, help="Email address of the user to promote.")
    args = parser.parse_args()

    asyncio.run(make_superuser(args.email))

if __name__ == "__main__":
    main()
