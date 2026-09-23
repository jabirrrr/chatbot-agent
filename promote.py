import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.lytrrhxsokaxzcaawyzy:uGl3AJdpy9m5NF5i@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

async def promote_user(email: str):
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("UPDATE users SET is_superuser = true WHERE email = :email RETURNING id"), {"email": email})
        user_id = result.scalar()
        await session.commit()
        
        if user_id:
            print(f"Success! Promoted {email} to superuser. User ID: {user_id}")
        else:
            print(f"Error: User {email} not found in the database.")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(promote_user("cgenos46@gmail.com"))
