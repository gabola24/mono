from __future__ import annotations
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.conversation import MessageRequest
from app.services.conversation import (
    get_or_create_conversation,
    stream_response,
    list_conversations,
    fetch_history,
)

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(req: MessageRequest, session: AsyncSession = Depends(get_session)):
    conversation_id = await get_or_create_conversation(session, req.conversation_id)

    async def event_stream():
        yield f"data: {json.dumps({'type': 'conversation_id', 'value': conversation_id})}\n\n"
        async for event in stream_response(session, conversation_id, req.content):
            yield f"data: {json.dumps(event)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/conversations")
async def get_conversations(session: AsyncSession = Depends(get_session)):
    return await list_conversations(session)


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, session: AsyncSession = Depends(get_session)):
    history = await fetch_history(session, conversation_id)
    return {"id": conversation_id, "messages": history}
