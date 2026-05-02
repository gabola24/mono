from __future__ import annotations
from pydantic import BaseModel


class PlanStep(BaseModel):
    order: int
    title: str
    description: str
    done: bool = False


class GeneratePlanRequest(BaseModel):
    topic: str
    context: str = ""


class PlanResponse(BaseModel):
    id: str
    title: str
    summary: str
    steps: list[PlanStep]
    source_message: str | None = None
    created_at: str


class UpdateStepRequest(BaseModel):
    step_order: int
    done: bool


class HabitCreateRequest(BaseModel):
    name: str
    frequency: str = "daily"


class HabitResponse(BaseModel):
    id: str
    name: str
    frequency: str
    active: bool
    created_at: str
    streak: int = 0
    completed_today: bool = False


class CreativeDNAResponse(BaseModel):
    themes: list[str]
    color_tendencies: list[str]
    influences: list[str]
    patterns: list[str]
    creative_energy: str
    total_references: int
    total_conversations: int
