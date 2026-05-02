from __future__ import annotations
from pydantic import BaseModel


class SkillNodeResponse(BaseModel):
    id: str
    name: str
    category: str | None = None
    description: str | None = None
    xp: int = 0
    level: int = 1
    created_at: str


class SkillEdgeResponse(BaseModel):
    id: str
    source_id: str
    target_id: str
    strength: float = 0.5
    reason: str | None = None


class SkillBadgeResponse(BaseModel):
    id: str
    skill_node_id: str
    name: str
    description: str
    earned_at: str


class SkillTreeResponse(BaseModel):
    nodes: list[SkillNodeResponse]
    edges: list[SkillEdgeResponse]
    badges: list[SkillBadgeResponse]


class SkillSummaryResponse(BaseModel):
    top_skills: list[SkillNodeResponse]
    total_nodes: int
    total_badges: int
