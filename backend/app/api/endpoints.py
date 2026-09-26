from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
import time

# Simple in-memory TTL cache for read-heavy endpoints
_cache: dict = {}

def get_cached(key: str, ttl: int = 10):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < ttl:
        return entry["data"]
    return None

def set_cache(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}

from app.database.connection import get_db
from app.database.models import Task, Agent, AgentRun, Evaluation, ActivityEvent
from app.schemas.task import TaskCreate, Task as TaskSchema, TaskDetail
from app.schemas.agent import Agent as AgentSchema, AgentStats
from app.services.task_service import process_task
from pydantic import BaseModel

class AgentCreateRequest(BaseModel):
    name: str
    model: str
from app.services.task_service import process_task

router = APIRouter()

@router.get("/agents")
async def get_agents(db: AsyncSession = Depends(get_db)):
    cached = get_cached("agents", ttl=15)
    if cached is not None:
        return JSONResponse(content=cached, headers={"Cache-Control": "public, max-age=10"})
    result = await db.execute(select(Agent).order_by(Agent.name.asc()))
    agents = result.scalars().all()
    data = [{"id": a.id, "name": a.name, "role": a.role, "description": a.description, "model": a.model, "system_prompt": a.system_prompt, "status": a.status, "created_at": a.created_at.isoformat()} for a in agents]
    set_cache("agents", data)
    return JSONResponse(content=data, headers={"Cache-Control": "public, max-age=10"})

@router.post("/agents", response_model=AgentSchema)
async def create_agent(agent_in: AgentCreateRequest, db: AsyncSession = Depends(get_db)):
    agent_id = f"agent-{uuid.uuid4().hex[:8]}"
    agent = Agent(
        id=agent_id,
        name=agent_in.name,
        role="Evaluator",
        description=f"Automated evaluator agent using {agent_in.model}",
        model=agent_in.model,
        system_prompt="You are a strict and helpful AI assistant.",
        status="active"
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    
    _cache.pop("agents", None)
    _cache.pop("leaderboard", None)
    return agent

@router.post("/tasks", response_model=TaskSchema)
async def create_task(task_in: TaskCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Verify at least one specified agent exists in the system
    stmt_agents = select(Agent.id).where(Agent.id.in_(task_in.agent_ids))
    valid_ids_res = await db.execute(stmt_agents)
    valid_ids = valid_ids_res.scalars().all()
    if not valid_ids:
        raise HTTPException(
            status_code=400,
            detail="None of the specified agent IDs were found in the database. Please provide valid agent IDs."
        )

    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        title=task_in.title,
        prompt=task_in.prompt,
        status="queued"
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    # Safely dispatch background task using validated agent IDs
    background_tasks.add_task(process_task, task_id, valid_ids)
    return task

@router.get("/tasks", response_model=List[TaskSchema])
async def get_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).order_by(Task.created_at.desc()))
    return result.scalars().all()

@router.get("/tasks/{task_id}", response_model=TaskDetail)
async def get_task_details(task_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Task).options(
        selectinload(Task.runs).selectinload(AgentRun.evaluation),
        selectinload(Task.runs).selectinload(AgentRun.agent)
    ).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "id": task.id,
        "title": task.title,
        "prompt": task.prompt,
        "status": task.status,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
        "runs": [
            {
                "id": run.id,
                "agent_id": run.agent_id,
                "agent_name": run.agent.name if run.agent else run.agent_id,
                "status": run.status,
                "response": run.response,
                "latency_ms": run.latency_ms,
                "estimated_cost": run.estimated_cost,
                "evaluation": {
                    "quality_score": run.evaluation.quality_score if run.evaluation else None,
                    "accuracy_score": run.evaluation.accuracy_score if run.evaluation else None,
                    "final_score": run.evaluation.final_score if run.evaluation else None,
                    "decision": run.evaluation.decision if run.evaluation else None,
                    "evaluator_feedback": run.evaluation.evaluator_feedback if run.evaluation else None,
                } if run.evaluation else None
            }
            for run in task.runs
        ]
    }

@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    cached = get_cached("leaderboard", ttl=10)
    if cached is not None:
        return JSONResponse(content=cached, headers={"Cache-Control": "public, max-age=8"})
    
    stmt = select(Agent)
    result = await db.execute(stmt)
    agents = result.scalars().all()
    
    run_stmt = select(AgentRun).options(selectinload(AgentRun.evaluation)).where(
        AgentRun.status == 'completed'
    )
    run_result = await db.execute(run_stmt)
    all_runs = run_result.scalars().all()
    
    runs_by_agent = {agent.id: [] for agent in agents}
    for r in all_runs:
        if r.agent_id in runs_by_agent:
            runs_by_agent[r.agent_id].append(r)
    
    leaderboard = []
    for agent in agents:
        runs = runs_by_agent[agent.id]
        completed_evals = [r.evaluation for r in runs if r.evaluation]
        
        if not runs or not completed_evals:
            leaderboard.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "role": agent.role,
                "total_tasks": 0,
                "score": 0.0,
                "quality": 0.0,
                "accuracy": 0.0,
                "latency_ms": 0.0,
                "cost": 0.0
            })
            continue
            
        avg_score = sum(e.final_score for e in completed_evals) / len(completed_evals)
        avg_quality = sum(e.quality_score for e in completed_evals) / len(completed_evals)
        avg_accuracy = sum(e.accuracy_score for e in completed_evals) / len(completed_evals)
        avg_latency = sum(r.latency_ms for r in runs if r.latency_ms is not None) / max(1, len([r for r in runs if r.latency_ms is not None]))
        avg_cost = sum(r.estimated_cost for r in runs if r.estimated_cost is not None) / max(1, len([r for r in runs if r.estimated_cost is not None]))
        
        leaderboard.append({
            "agent_id": agent.id,
            "agent_name": agent.name,
            "role": agent.role,
            "total_tasks": len(runs),
            "score": round(avg_score, 1),
            "quality": round(avg_quality, 1),
            "accuracy": round(avg_accuracy, 1),
            "latency_ms": round(avg_latency, 1),
            "cost": round(avg_cost, 4)
        })
        
    leaderboard.sort(key=lambda x: (x["total_tasks"] > 0, x["score"]), reverse=True)
    set_cache("leaderboard", leaderboard)
    return JSONResponse(content=leaderboard, headers={"Cache-Control": "public, max-age=8"})

@router.get("/activity")
async def get_activity(db: AsyncSession = Depends(get_db), limit: int = 20):
    stmt = select(ActivityEvent).order_by(ActivityEvent.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    events = result.scalars().all()
    return events

