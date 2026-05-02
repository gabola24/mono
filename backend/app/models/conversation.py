from __future__ import annotations
from pydantic import BaseModel


class MessageRequest(BaseModel):
    content: str
    conversation_id: str | None = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    title: str | None
    created_at: str
    messages: list[MessageResponse] = []
