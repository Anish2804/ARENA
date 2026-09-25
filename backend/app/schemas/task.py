from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    prompt: str = Field(..., min_length=1, description="Task prompt")
    agent_ids: List[str] = Field(..., min_items=1, description="List of agent IDs to run")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Task title cannot be empty or whitespace only")
        return cleaned

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Task prompt cannot be empty or whitespace only")
        return cleaned

    @field_validator("agent_ids")
    @classmethod
    def validate_agent_ids(cls, v: List[str]) -> List[str]:
        cleaned = [aid.strip() for aid in v if isinstance(aid, str) and aid.strip()]
        if not cleaned:
            raise ValueError("At least one valid agent ID must be provided")
        # Deduplicate while preserving order
        return list(dict.fromkeys(cleaned))

class TaskBase(BaseModel):
    id: str
    title: str
    prompt: str
    status: str
    
class Task(TaskBase):
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EvaluationSummary(BaseModel):
    quality_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    final_score: Optional[float] = None
    decision: Optional[str] = None
    evaluator_feedback: Optional[str] = None

class AgentRunDetail(BaseModel):
    id: str
    agent_id: str
    agent_name: str
    status: str
    response: Optional[str] = None
    latency_ms: Optional[float] = None
    estimated_cost: Optional[float] = None
    evaluation: Optional[EvaluationSummary] = None

class TaskDetail(TaskBase):
    created_at: datetime
    completed_at: Optional[datetime] = None
    runs: List[AgentRunDetail] = []
