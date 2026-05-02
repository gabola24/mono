from __future__ import annotations
import uuid
from datetime import datetime, timezone
from collections.abc import AsyncGenerator

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import settings
from app.db.database import conversations, messages
from app.services.personality import build_messages
from app.services.rag_pipeline import retrieve_context, format_context_for_prompt

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def get_or_create_conversation(session: AsyncSession, conversation_id: str | None) -> str:
    if conversation_id:
        result = await session.execute(
            sa.select(conversations.c.id).where(conversations.c.id == conversation_id)
        )
        if result.scalar_one_or_none():
            return conversation_id

    new_id = str(uuid.uuid4())
    await session.execute(conversations.insert().values(id=new_id))
    await session.commit()
    return new_id


async def fetch_history(session: AsyncSession, conversation_id: str) -> list[dict]:
    result = await session.execute(
        sa.select(messages.c.role, messages.c.content)
        .where(messages.c.conversation_id == conversation_id)
        .order_by(messages.c.created_at)
    )
    return [{"role": row.role, "content": row.content} for row in result.fetchall()]


async def save_message(session: AsyncSession, conversation_id: str, role: str, content: str):
    await session.execute(
        messages.insert().values(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=datetime.now(timezone.utc),
        )
    )
    await session.commit()


async def stream_response(
    session: AsyncSession, conversation_id: str, user_message: str
) -> AsyncGenerator[str, None]:
    """Stream the assistant response token by token, then persist both messages."""
    history = await fetch_history(session, conversation_id)

    refs = await retrieve_context(user_message)
    rag_context = format_context_for_prompt(refs)
    api_messages = await build_messages(history, user_message, rag_context=rag_context)

    await save_message(session, conversation_id, "user", user_message)

    full_response = []
    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=api_messages,
        stream=True,
        temperature=0.9,
        max_tokens=512,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_response.append(delta.content)
            yield delta.content

    assistant_text = "".join(full_response)
    await save_message(session, conversation_id, "assistant", assistant_text)

    from app.services.skill_discovery import process_skill_discovery
    from app.services.mind_graph_sync import sync_mind_graph
    combined = f"User: {user_message}\nAssistant: {assistant_text}"
    await process_skill_discovery(session, combined)
    await sync_mind_graph(session)


async def list_conversations(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        sa.select(conversations).order_by(conversations.c.created_at.desc())
    )
    return [
        {"id": row.id, "title": row.title, "created_at": str(row.created_at)}
        for row in result.fetchall()
    ]
