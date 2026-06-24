from __future__ import annotations
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import skill_nodes, skill_edges, skill_badges


async def _badge_exists(session: AsyncSession, user_id: str, name: str, node_id: str | None = None) -> bool:
    query = sa.select(skill_badges.c.id).where(
        skill_badges.c.user_id == user_id,
        skill_badges.c.name == name,
    )
    if node_id:
        query = query.where(skill_badges.c.skill_node_id == node_id)
    result = await session.execute(query)
    return result.fetchone() is not None


async def _award(session: AsyncSession, user_id: str, node_id: str, name: str, description: str) -> dict:
    badge_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await session.execute(
        skill_badges.insert().values(
            id=badge_id,
            user_id=user_id,
            skill_node_id=node_id,
            name=name,
            description=description,
            earned_at=now,
        )
    )
    return {"id": badge_id, "name": name, "description": description, "earned_at": now.isoformat()}


async def check_and_award_badges(session: AsyncSession, user_id: str) -> list[dict]:
    awarded: list[dict] = []

    nodes_result = await session.execute(
        sa.select(skill_nodes.c.id, skill_nodes.c.name, skill_nodes.c.category, skill_nodes.c.level)
        .where(skill_nodes.c.user_id == user_id)
    )
    all_nodes = nodes_result.fetchall()
    if not all_nodes:
        return awarded

    categories: dict[str, list] = {}
    for node in all_nodes:
        cat = node.category or "uncategorized"
        categories.setdefault(cat, []).append(node)

    for cat, cat_nodes in categories.items():
        if len(cat_nodes) == 1:
            node = cat_nodes[0]
            if not await _badge_exists(session, user_id, "Pioneer", node.id):
                awarded.append(await _award(session, user_id, node.id, "Pioneer",
                                            f"First explorer of the {cat} domain"))

    for node in all_nodes:
        if node.level >= 5 and not await _badge_exists(session, user_id, "Deep Dive", node.id):
            awarded.append(await _award(session, user_id, node.id, "Deep Dive",
                                        f"Mastered {node.name} to level 5"))

    edges_result = await session.execute(
        sa.select(skill_edges).where(skill_edges.c.user_id == user_id)
    )
    all_edges = edges_result.fetchall()
    node_map = {n.id: n for n in all_nodes}

    for edge in all_edges:
        src = node_map.get(edge.source_id)
        tgt = node_map.get(edge.target_id)
        if src and tgt and (src.category or "") != (tgt.category or ""):
            if not await _badge_exists(session, user_id, "Bridge Builder", edge.source_id):
                awarded.append(await _award(session, user_id, edge.source_id, "Bridge Builder",
                                            f"Connected {src.category} to {tgt.category}"))

    if len(categories) >= 5 and not await _badge_exists(session, user_id, "Polymath"):
        awarded.append(await _award(session, user_id, all_nodes[0].id, "Polymath",
                                    f"Knowledge spans {len(categories)} domains"))

    if awarded:
        await session.commit()
    return awarded
