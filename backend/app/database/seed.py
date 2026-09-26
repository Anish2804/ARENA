import asyncio
import sys
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.future import select
from app.database.connection import engine, AsyncSessionLocal, Base
from app.database.models import Agent
from app.config.settings import settings

DEFAULT_AGENTS = [
    {
        "id": "research-pro",
        "name": "Research-Pro",
        "role": "Deep Research Specialist",
        "description": "Exhaustive multi-dimensional coverage, deep structured reasoning, risk factor identification, and thorough analysis. Prioritizes depth and quality over speed.",
        "provider": "groq",
        "model": "openai/gpt-oss-120b",
        "system_prompt": "You are Research-Pro. Your mandate is exhaustive, multi-dimensional analysis with rigorous structural breakdown. Prioritize analytical depth, completeness, and structured nuance."
    },
    {
        "id": "precision-x",
        "name": "Precision-X",
        "role": "Factual Precision Analyst",
        "description": "Strictly verified facts, deterministic logic, concise bulleted reasoning, zero filler, and zero speculative claims.",
        "provider": "groq",
        "model": "qwen/qwen3.8-27b",
        "system_prompt": "You are Precision-X. Your mandate is absolute accuracy and verifiable assertions. Structure your response into concise, validated claims with zero speculation."
    },
    {
        "id": "fast-research",
        "name": "Fast-Research",
        "role": "High-Speed & Cost Optimizer",
        "description": "Ultra-low latency, maximum token efficiency, and immediate high-signal conclusions with minimum resource footprint.",
        "provider": "groq",
        "model": "openai/gpt-oss-20b",
        "system_prompt": "You are Fast-Research. Your mandate is minimal latency and max token efficiency. Deliver immediate, high-signal, punchy conclusions."
    },
    {
        "id": "general-agent",
        "name": "General-Agent",
        "role": "Balanced Strategy Analyst",
        "description": "Balanced quality, balanced speed, and balanced cost. Provides accessible, well-rounded overviews for diverse stakeholders.",
        "provider": "groq",
        "model": "allam-2-7b",
        "system_prompt": "You are General-Agent. Your mandate is a well-rounded response balancing clarity, analytical depth, and practical utility."
    }
]

async def seed_agents(db: AsyncSession):
    # Check if agents already exist
    result = await db.execute(select(Agent))
    existing_agents = {a.id: a for a in result.scalars().all()}
    
    for agent_data in DEFAULT_AGENTS:
        if agent_data["id"] in existing_agents:
            existing = existing_agents[agent_data["id"]]
            existing.model = agent_data["model"]
            existing.provider = agent_data["provider"]
            existing.name = agent_data["name"]
            existing.role = agent_data["role"]
            existing.description = agent_data["description"]
            existing.system_prompt = agent_data["system_prompt"]
        else:
            new_agent = Agent(**agent_data)
            db.add(new_agent)

    await db.commit()
    print(f"Successfully seeded/updated agents with model: {settings.LLM_MODEL}")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        await seed_agents(session)

if __name__ == "__main__":
    asyncio.run(init_db())
