from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MindNodeCreate(BaseModel):
    text: str = Field(..., max_length=280)
    category: Optional[str] = "idea"
    color: Optional[str] = "#FF6B9D"
    source: Optional[str] = "manual"

class MindNodeResponse(MindNodeCreate):
    id: str
    created_at: datetime

class NodeConnectionCreate(BaseModel):
    source_id: str
    target_id: str
    strength: float = 0.5
    reason: Optional[str] = None
    kind: Optional[str] = None

class NodeConnectionResponse(NodeConnectionCreate):
    id: str
    created_at: Optional[datetime] = None

class GraphResponse(BaseModel):
    nodes: list[MindNodeResponse]
    edges: list[NodeConnectionResponse]

class LinkGameRound(BaseModel):
    conceptA: str
    conceptB: str
    user_connection: str

class LinkGameSession(BaseModel):
    rounds: list[LinkGameRound]
    total_time_ms: int
    date: str
