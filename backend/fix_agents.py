from app.database.connection import AsyncSessionLocal
from app.database.models import Agent
import asyncio
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def fix_agents():
    async with AsyncSessionLocal() as session:
        result = await session.execute(Agent.__table__.select())
        agents = result.fetchall()
        for a in agents:
            if '/' in a.model and a.provider == 'groq':
                provider, model = a.model.split('/', 1)
                await session.execute(Agent.__table__.update().where(Agent.id == a.id).values(provider=provider, model=model))
        await session.commit()
asyncio.run(fix_agents())
