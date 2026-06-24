from __future__ import annotations
import uuid

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import skill_nodes, skill_edges, mind_nodes, node_connections
from app.services.edge_reasoning import generate_edge_reason


async def sync_mind_graph(session: AsyncSession, user_id: str) -> dict:
    """Mirror skill nodes/edges into the mind graph without creating duplicates."""

    skill_res = await session.execute(
        sa.select(skill_nodes.c.id, skill_nodes.c.name, skill_nodes.c.category)
        .where(skill_nodes.c.user_id == user_id)
    )
    skills = skill_res.fetchall()
    if not skills:
        return {"added_nodes": 0, "added_edges": 0}

    mind_res = await session.execute(
        sa.select(mind_nodes.c.id, mind_nodes.c.text).where(mind_nodes.c.user_id == user_id)
    )
    text_to_mind_id: dict[str, str] = {row.text: row.id for row in mind_res.fetchall()}

    skill_name_to_mind_id: dict[str, str] = {}
    added_nodes = 0
    for skill in skills:
        if skill.name in text_to_mind_id:
            skill_name_to_mind_id[skill.name] = text_to_mind_id[skill.name]
        else:
            node_id = f"mn_{uuid.uuid4().hex[:8]}"
            await session.execute(
                sa.insert(mind_nodes).values(
                    id=node_id,
                    user_id=user_id,
                    text=skill.name,
                    category=skill.category or "learning",
                    color="#82aaff",
                    source="dna-import",
                )
            )
            skill_name_to_mind_id[skill.name] = node_id
            text_to_mind_id[skill.name] = node_id
            added_nodes += 1

    skill_id_to_name = {s.id: s.name for s in skills}

    edges_res = await session.execute(
        sa.select(
            skill_edges.c.source_id,
            skill_edges.c.target_id,
            skill_edges.c.strength,
            skill_edges.c.reason,
        ).where(skill_edges.c.user_id == user_id)
    )

    existing_edges_res = await session.execute(
        sa.select(node_connections.c.source_id, node_connections.c.target_id)
        .where(node_connections.c.user_id == user_id)
    )
    existing_pairs: set[frozenset[str]] = {
        frozenset([row.source_id, row.target_id]) for row in existing_edges_res.fetchall()
    }

    added_edges = 0
    for edge in edges_res.fetchall():
        src_name = skill_id_to_name.get(edge.source_id)
        tgt_name = skill_id_to_name.get(edge.target_id)
        if not src_name or not tgt_name:
            continue
        src_mind = skill_name_to_mind_id.get(src_name)
        tgt_mind = skill_name_to_mind_id.get(tgt_name)
        if not src_mind or not tgt_mind:
            continue
        pair = frozenset([src_mind, tgt_mind])
        if pair in existing_pairs:
            continue

        reason = await generate_edge_reason(src_name, tgt_name, hint=edge.reason)
        edge_id = f"edge_{uuid.uuid4().hex[:8]}"
        await session.execute(
            sa.insert(node_connections).values(
                id=edge_id,
                user_id=user_id,
                source_id=src_mind,
                target_id=tgt_mind,
                strength=edge.strength,
                reason=reason,
                kind="sync",
            )
        )
        existing_pairs.add(pair)
        added_edges += 1

    await session.commit()
    return {"added_nodes": added_nodes, "added_edges": added_edges}
