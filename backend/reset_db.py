import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.append('d:/Projects/ARENA/backend')

from app.database.connection import engine, Base, AsyncSessionLocal
from app.database.seed import seed_agents

async def reset():
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Recreating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        print("Seeding agents...")
        await seed_agents(session)
    print("Database wiped and seeded.")

if __name__ == "__main__":
    asyncio.run(reset())
