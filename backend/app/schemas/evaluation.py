from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EvaluationBase(BaseModel):
    quality_score: float
    accuracy_score: float
    evaluator_feedback: Optional[str] = None
    decision: Optional[str] = None
    final_score: float

class Evaluation(EvaluationBase):
    id: str
    agent_run_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class AgentRunBase(BaseModel):
    id: str
    task_id: str
    agent_id: str
    status: str
    response: Optional[str] = None
    latency_ms: Optional[float] = None
    estimated_cost: Optional[float] = None

class AgentRun(AgentRunBase):
    created_at: datetime
    evaluation: Optional[Evaluation] = None

    class Config:
        from_attributes = True
