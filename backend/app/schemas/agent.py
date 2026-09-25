from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AgentBase(BaseModel):
    id: str
    name: str
    role: str
    description: str
    model: str
    system_prompt: str
    status: str = "active"

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    created_at: datetime
    
    class Config:
        from_attributes = True

class AgentStats(BaseModel):
    id: str
    total_tasks: int
    avg_score: float
    avg_latency: float
    avg_cost: float
