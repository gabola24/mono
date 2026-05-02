"""
GET /api/companion/traits
Derives Mono's visual accessories from the user's Creative DNA profile.
No OpenAI call needed — uses existing skills table for fast lookup.
"""
from __future__ import annotations
from typing import List
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session

router = APIRouter(tags=["companion"])

# Keyword → trait mapping (mirrors frontend DNA_TRAIT_MAP)
TRAIT_MAP = {
    "music":      {"id": "headphones",  "label": "headphones",    "symbol": "🎧", "color": "#82aaff"},
    "audio":      {"id": "headphones",  "label": "headphones",    "symbol": "🎧", "color": "#82aaff"},
    "design":     {"id": "pencil",      "label": "pencil",        "symbol": "✏️",  "color": "#f7dc6f"},
    "creative":   {"id": "pencil",      "label": "pencil",        "symbol": "✏️",  "color": "#f7dc6f"},
    "code":       {"id": "glasses",     "label": "dev glasses",   "symbol": "👓", "color": "#c792ea"},
    "technical":  {"id": "glasses",     "label": "dev glasses",   "symbol": "👓", "color": "#c792ea"},
    "writing":    {"id": "quill",       "label": "quill",         "symbol": "🪶", "color": "#a8e6cf"},
    "philosophy": {"id": "hat",         "label": "thinking hat",  "symbol": "🎩", "color": "#ff8a5c"},
    "science":    {"id": "telescope",   "label": "telescope",     "symbol": "🔭", "color": "#82aaff"},
}


class TraitItem(BaseModel):
    id: str
    label: str
    symbol: str
    color: str


class TraitsResponse(BaseModel):
    traits: List[TraitItem]
    source_skills: List[str]


@router.get("/companion/traits", response_model=TraitsResponse)
async def get_companion_traits(session: AsyncSession = Depends(get_session)):
    """
    Derives 0-2 visual traits for Mono based on the user's top skill categories.
    Fast: reads from skills table, no LLM call.
    """
    from app.db.database import skill_nodes  # late import to avoid circular

    result = await session.execute(
        sa.select(skill_nodes.c.name, skill_nodes.c.category, skill_nodes.c.level)
        .order_by(skill_nodes.c.level.desc())
        .limit(20)
    )
    rows = result.fetchall()

    seen_ids: set[str] = set()
    found_traits: list[TraitItem] = []
    source_skills: list[str] = []

    for row in rows:
        combined = " ".join(
            filter(None, [row.name or "", row.category or ""])
        ).lower()
        for keyword, trait_data in TRAIT_MAP.items():
            if keyword in combined and trait_data["id"] not in seen_ids:
                seen_ids.add(trait_data["id"])
                found_traits.append(TraitItem(**trait_data))
                source_skills.append(row.name)
                if len(found_traits) >= 2:
                    break
        if len(found_traits) >= 2:
            break

    return TraitsResponse(traits=found_traits, source_skills=source_skills)
