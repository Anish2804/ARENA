import asyncio
import uuid
import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Task, Agent, AgentRun, Evaluation, ActivityEvent
from app.agents.executor import execute_agent
from app.evaluation.evaluator import evaluate_response, calculate_final_score

logger = logging.getLogger("arena.task_service")

# Agent-specific inference profiles for sharp differentiation
AGENT_PROFILES = {
    "research-pro": {"temperature": 0.4, "max_tokens": 1500},
    "precision-x": {"temperature": 0.1, "max_tokens": 800},
    "fast-research": {"temperature": 0.5, "max_tokens": 400},
    "general-agent": {"temperature": 0.7, "max_tokens": 1000},
}

async def _log_activity(db: AsyncSession, event_type: str, message: str, task_id: str = None, agent_id: str = None):
    try:
        event = ActivityEvent(
            id=str(uuid.uuid4()),
            task_id=task_id,
            agent_id=agent_id,
            event_type=event_type,
            message=message
        )
        db.add(event)
    except Exception as e:
        logger.warning(f"Could not log activity event: {e}")

class AgentRuntimePayload:
    def __init__(self, name: str, model: str, system_prompt: str, temperature: float = 0.7, max_tokens: int = 1024):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.max_tokens = max_tokens

async def process_task(task_id: str, agent_ids: list[str]):
    try:
        # Phase 1: Initialize Task and Agent Runs in DB
        runs_data = []
        task_prompt = ""
        
        async with AsyncSessionLocal() as session:
            stmt = select(Task).where(Task.id == task_id)
            result = await session.execute(stmt)
            task = result.scalar_one_or_none()
            if not task:
                logger.error(f"Task {task_id} not found in database")
                return
                
            task.status = "running"
            await _log_activity(session, "TASK_STARTED", f"Task {task.id[:8]} started", task_id=task.id)
            
            # Query agents
            stmt_agents = select(Agent).where(Agent.id.in_(agent_ids))
            res_agents = await session.execute(stmt_agents)
            agents = res_agents.scalars().all()
            
            if not agents:
                task.status = "failed"
                task.completed_at = datetime.datetime.now(datetime.timezone.utc)
                await _log_activity(session, "TASK_FAILED", f"No valid agents found for task {task.id[:8]}", task_id=task.id)
                await session.commit()
                return
                
            task_prompt = task.prompt
            
            for agent in agents:
                run_id = str(uuid.uuid4())
                run = AgentRun(
                    id=run_id,
                    task_id=task.id,
                    agent_id=agent.id,
                    status="running"
                )
                session.add(run)
                
                profile = AGENT_PROFILES.get(agent.id, {"temperature": 0.7, "max_tokens": 1024})
                runs_data.append({
                    "run_id": run_id,
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "agent_role": agent.role,
                    "model": agent.model,
                    "system_prompt": agent.system_prompt,
                    "temperature": profile["temperature"],
                    "max_tokens": profile["max_tokens"]
                })
                await _log_activity(session, "AGENT_DISPATCHED", f"{agent.name} dispatched for task", task_id=task.id, agent_id=agent.id)
                
            await session.commit()

        # Phase 2: Concurrent Agent Execution (Pure Async LLM Calls, No DB Sessions Held)
        async def run_single_agent(agent_info: dict):
            try:
                agent_payload = AgentRuntimePayload(
                    name=agent_info["agent_name"],
                    model=agent_info["model"],
                    system_prompt=agent_info["system_prompt"],
                    temperature=agent_info["temperature"],
                    max_tokens=agent_info["max_tokens"]
                )
                exec_result = await execute_agent(agent_payload, task_prompt)
                return agent_info["run_id"], agent_info["agent_id"], agent_info["agent_name"], exec_result
            except Exception as e:
                logger.error(f"Unexpected error executing agent {agent_info.get('agent_name')}: {e}", exc_info=True)
                return agent_info["run_id"], agent_info["agent_id"], agent_info["agent_name"], {
                    "status": "failed",
                    "response": f"Execution failed: {str(e)}",
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "latency_ms": 0.0,
                    "estimated_cost": 0.0
                }

        # Fan out all 4 agents concurrently
        agent_results = await asyncio.gather(*(run_single_agent(a) for a in runs_data))

        # Phase 3: Concurrent Evaluation for Completed Responses
        async def evaluate_single_result(run_id, agent_id, agent_name, exec_result):
            if exec_result.get("status") == "completed":
                try:
                    eval_result = await evaluate_response(task_prompt, exec_result.get("response", ""))
                    final_score = calculate_final_score(
                        eval_result["quality_score"],
                        eval_result["accuracy_score"],
                        exec_result.get("estimated_cost", 0.0),
                        exec_result.get("latency_ms", 0.0)
                    )
                    eval_result["final_score"] = final_score
                    return run_id, agent_id, agent_name, exec_result, eval_result
                except Exception as e:
                    logger.error(f"Unexpected error evaluating agent {agent_name}: {e}", exc_info=True)
                    return run_id, agent_id, agent_name, exec_result, {
                        "quality_score": 0.0,
                        "accuracy_score": 0.0,
                        "evaluator_feedback": f"Evaluation crashed: {str(e)}",
                        "decision": "rejected",
                        "final_score": 0.0
                    }
            return run_id, agent_id, agent_name, exec_result, None

        # Fan out all evaluations concurrently
        evaluated_results = await asyncio.gather(*(
            evaluate_single_result(r_id, a_id, a_name, res) 
            for r_id, a_id, a_name, res in agent_results
        ))

        # Phase 4: Persist All Results Safely in a Single Transaction
        async with AsyncSessionLocal() as session:
            any_success = False
            for run_id, agent_id, agent_name, exec_result, eval_result in evaluated_results:
                stmt = select(AgentRun).where(AgentRun.id == run_id)
                run_db = (await session.execute(stmt)).scalar_one_or_none()
                if run_db:
                    run_db.status = exec_result.get("status", "failed")
                    run_db.response = exec_result.get("response")
                    run_db.input_tokens = exec_result.get("input_tokens", 0)
                    run_db.output_tokens = exec_result.get("output_tokens", 0)
                    run_db.total_tokens = exec_result.get("total_tokens", 0)
                    run_db.latency_ms = exec_result.get("latency_ms", 0.0)
                    run_db.estimated_cost = exec_result.get("estimated_cost", 0.0)

                if exec_result.get("status") == "completed" and eval_result:
                    any_success = True
                    evaluation = Evaluation(
                        id=str(uuid.uuid4()),
                        agent_run_id=run_id,
                        quality_score=eval_result["quality_score"],
                        accuracy_score=eval_result["accuracy_score"],
                        evaluator_feedback=eval_result["evaluator_feedback"],
                        decision=eval_result["decision"],
                        final_score=eval_result["final_score"]
                    )
                    session.add(evaluation)
                    await _log_activity(
                        session, 
                        "AGENT_COMPLETED", 
                        f"{agent_name} completed in {exec_result['latency_ms']:.0f}ms", 
                        task_id=task_id, 
                        agent_id=agent_id
                    )
                    await _log_activity(
                        session, 
                        "AGENT_EVALUATED", 
                        f"{agent_name} scored {eval_result['final_score']}/100 ({eval_result['decision'].upper()})", 
                        task_id=task_id, 
                        agent_id=agent_id
                    )
                else:
                    await _log_activity(
                        session, 
                        "AGENT_FAILED", 
                        f"{agent_name} failed: {exec_result.get('response', 'Unknown failure')[:100]}", 
                        task_id=task_id, 
                        agent_id=agent_id
                    )

            stmt = select(Task).where(Task.id == task_id)
            task_db = (await session.execute(stmt)).scalar_one_or_none()
            if task_db:
                task_db.status = "completed" if any_success else "failed"
                task_db.completed_at = datetime.datetime.now(datetime.timezone.utc)
                
            status_text = "completed" if any_success else "failed"
            await _log_activity(session, f"TASK_{status_text.upper()}", f"Task {task_id[:8]} {status_text}", task_id=task_id)
            await session.commit()

    except Exception as catastrophic_err:
        logger.error(f"Catastrophic failure processing task {task_id}: {catastrophic_err}", exc_info=True)
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(Task).where(Task.id == task_id)
                task_db = (await session.execute(stmt)).scalar_one_or_none()
                if task_db:
                    task_db.status = "failed"
                    task_db.completed_at = datetime.datetime.now(datetime.timezone.utc)
                await _log_activity(session, "TASK_FAILED", f"Task aborted due to system error: {str(catastrophic_err)[:100]}", task_id=task_id)
                await session.commit()
        except Exception as cleanup_err:
            logger.error(f"Failed to record task failure for {task_id}: {cleanup_err}")
