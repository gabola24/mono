from __future__ import annotations
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, skill_nodes, skill_edges, skill_badges, references
from app.models.skill import (
    SkillNodeResponse,
    SkillEdgeResponse,
    SkillBadgeResponse,
    SkillTreeResponse,
    SkillSummaryResponse,
)
from app.services.skill_discovery import process_skill_discovery

router = APIRouter(tags=["skills"])


@router.get("/skills/tree", response_model=SkillTreeResponse)
async def get_skill_tree(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    nodes_result = await session.execute(
        sa.select(skill_nodes)
        .where(skill_nodes.c.user_id == user_id)
        .order_by(skill_nodes.c.xp.desc())
    )
    edges_result = await session.execute(
        sa.select(skill_edges).where(skill_edges.c.user_id == user_id)
    )
    badges_result = await session.execute(
        sa.select(skill_badges)
        .where(skill_badges.c.user_id == user_id)
        .order_by(skill_badges.c.earned_at.desc())
    )

    return SkillTreeResponse(
        nodes=[
            SkillNodeResponse(
                id=r.id, name=r.name, category=r.category,
                description=r.description, xp=r.xp, level=r.level,
                created_at=str(r.created_at),
            )
            for r in nodes_result.fetchall()
        ],
        edges=[
            SkillEdgeResponse(
                id=r.id, source_id=r.source_id, target_id=r.target_id,
                strength=r.strength, reason=r.reason,
            )
            for r in edges_result.fetchall()
        ],
        badges=[
            SkillBadgeResponse(
                id=r.id, skill_node_id=r.skill_node_id, name=r.name,
                description=r.description, earned_at=str(r.earned_at),
            )
            for r in badges_result.fetchall()
        ],
    )


@router.get("/skills/summary", response_model=SkillSummaryResponse)
async def get_skill_summary(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    top_result = await session.execute(
        sa.select(skill_nodes)
        .where(skill_nodes.c.user_id == user_id)
        .order_by(skill_nodes.c.xp.desc())
        .limit(5)
    )
    total_result = await session.execute(
        sa.select(sa.func.count())
        .select_from(skill_nodes)
        .where(skill_nodes.c.user_id == user_id)
    )
    badge_count_result = await session.execute(
        sa.select(sa.func.count())
        .select_from(skill_badges)
        .where(skill_badges.c.user_id == user_id)
    )

    return SkillSummaryResponse(
        top_skills=[
            SkillNodeResponse(
                id=r.id, name=r.name, category=r.category,
                description=r.description, xp=r.xp, level=r.level,
                created_at=str(r.created_at),
            )
            for r in top_result.fetchall()
        ],
        total_nodes=total_result.scalar() or 0,
        total_badges=badge_count_result.scalar() or 0,
    )


@router.post("/skills/reanalyze")
async def reanalyze_all_references(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    """Re-analyze all references for skill discovery."""
    result = await session.execute(
        sa.select(references.c.content)
        .where(references.c.user_id == user_id)
        .order_by(references.c.created_at)
    )
    all_badges = []
    for row in result.fetchall():
        badges = await process_skill_discovery(session, row.content, user_id)
        all_badges.extend(badges)

    return {"status": "complete", "new_badges": all_badges}
