from __future__ import annotations
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, references, messages, conversations
from app.models.plan import CreativeDNAResponse
from app.services.structured_output import analyze_creative_dna

router = APIRouter(tags=["profile"])


@router.get("/profile/dna", response_model=CreativeDNAResponse)
async def get_creative_dna(session: AsyncSession = Depends(get_session)):
    refs_result = await session.execute(
        sa.select(references.c.title, references.c.content, references.c.type)
        .order_by(references.c.created_at.desc())
    )
    ref_texts = [
        f"[{row.type}] {row.title}: {row.content}" for row in refs_result.fetchall()
    ]

    msgs_result = await session.execute(
        sa.select(messages.c.role, messages.c.content)
        .order_by(messages.c.created_at.desc())
        .limit(40)
    )
    conversation_snippets = [
        f"{row.role}: {row.content}" for row in msgs_result.fetchall()
    ]

    total_refs = await session.execute(sa.select(sa.func.count()).select_from(references))
    total_convos = await session.execute(sa.select(sa.func.count()).select_from(conversations))

    dna = await analyze_creative_dna(ref_texts, conversation_snippets)

    return CreativeDNAResponse(
        themes=dna.get("themes", []),
        color_tendencies=dna.get("color_tendencies", []),
        influences=dna.get("influences", []),
        patterns=dna.get("patterns", []),
        creative_energy=dna.get("creative_energy", ""),
        total_references=total_refs.scalar() or 0,
        total_conversations=total_convos.scalar() or 0,
    )
