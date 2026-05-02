from __future__ import annotations
from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    title: str
    description: str = ""
    status: str = "idea"
    priority: int = 3


class ProjectUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: int | None = None


class ProjectNoteRequest(BaseModel):
    content: str
    note_type: str = "thought"


class ProjectLinkRequest(BaseModel):
    link_type: str  # "plan" or "reference"
    link_id: str


class ProjectNoteResponse(BaseModel):
    id: str
    project_id: str
    content: str
    note_type: str
    created_at: str


class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: str
    priority: int
    plan_ids: list[str] = []
    reference_ids: list[str] = []
    notes: list[ProjectNoteResponse] = []
    created_at: str
    updated_at: str
