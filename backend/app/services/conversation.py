from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone
from collections.abc import AsyncGenerator

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import settings
from app.db.database import conversations, messages, async_session
from app.services.personality import build_messages
from app.services.rag_pipeline import retrieve_context, format_context_for_prompt

client = AsyncOpenAI(api_key=settings.openai_api_key)

HISTORY_TURNS = 10  # keep last N user+assistant pairs to cap context cost


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
        .order_by(messages.c.created_at.desc())
        .limit(HISTORY_TURNS * 2)
    )
    rows = list(reversed(result.fetchall()))
    return [{"role": row.role, "content": row.content} for row in rows]


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
) -> AsyncGenerator[dict, None]:
    """Stream the assistant response as dicts, then persist both messages."""
    # /inspire slash-command — generate an inspiration image grounded in RAG
    stripped = user_message.strip()
    if stripped.lower().startswith("/inspire"):
        brief = stripped[8:].strip()
        await save_message(session, conversation_id, "user", user_message)
        yield {"type": "image_pending", "value": "generating inspiration..."}
        try:
            from app.services.image_generation import generate_inspiration
            result = await generate_inspiration(brief)
            yield {"type": "image", **result}
            assistant_text = f"__image__:{result}"
        except Exception as e:
            yield {"type": "token", "value": f"Image generation failed: {e}"}
            assistant_text = f"Image generation failed: {e}"
        await save_message(session, conversation_id, "assistant", assistant_text)
        return

    history = await fetch_history(session, conversation_id)
    refs = await retrieve_context(user_message)
    rag_context = format_context_for_prompt(refs)
    api_messages = await build_messages(history, user_message, rag_context=rag_context)

    await save_message(session, conversation_id, "user", user_message)

    full_response = []
    stream = await client.chat.completions.create(
        model=settings.chat_model,
        messages=api_messages,
        stream=True,
        temperature=0.9,
        max_tokens=160,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_response.append(delta.content)
            yield {"type": "token", "value": delta.content}

    assistant_text = "".join(full_response)
    await save_message(session, conversation_id, "assistant", assistant_text)

    combined = f"User: {user_message}\nAssistant: {assistant_text}"
    asyncio.create_task(_background_analysis(combined))


async def _background_analysis(combined: str) -> None:
    """Run skill discovery + mind-graph sync in a background task with its own session."""
    from app.services.skill_discovery import process_skill_discovery
    from app.services.mind_graph_sync import sync_mind_graph
    try:
        async with async_session() as session:
            await process_skill_discovery(session, combined)
            await sync_mind_graph(session)
    except Exception:
        pass  # background task — never crash the caller


async def list_conversations(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        sa.select(conversations).order_by(conversations.c.created_at.desc())
    )
    return [
        {"id": row.id, "title": row.title, "created_at": str(row.created_at)}
        for row in result.fetchall()
    ]
