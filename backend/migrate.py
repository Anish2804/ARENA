
import asyncio
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import text
from app.database.connection import engine

async def main():
    async with engine.connect() as conn:
        try:
            await conn.execute(text("ALTER TABLE agents ADD COLUMN provider VARCHAR NOT NULL DEFAULT 'groq';"))
            await conn.commit()
            print('Added provider to agents')
        except Exception as e:
            print(f'Error adding provider to agents: {e}')
            await conn.rollback()

asyncio.run(main())

