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

class NodeConnectionResponse(NodeConnectionCreate):
    id: str

class GraphResponse(BaseModel):
    nodes: list[MindNodeResponse]
    edges: list[NodeConnectionResponse]
