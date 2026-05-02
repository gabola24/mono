from __future__ import annotations
from pydantic import BaseModel


class TextReferenceRequest(BaseModel):
    title: str = ""
    content: str


class ReferenceResponse(BaseModel):
    id: str
    type: str
    title: str
    content: str
    file_path: str | None = None
    created_at: str


class ReferenceStats(BaseModel):
    total_count: int
    text_count: int
    image_count: int
    trust_level: float
