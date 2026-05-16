from __future__ import annotations
import uuid

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, mind_nodes, node_connections
from app.models.graph import LinkGameRound, LinkGameSession

router = APIRouter()


async def _upsert_node(session: AsyncSession, text: str) -> str:
    """Return id of existing node with this text, or insert and return new id."""
    res = await session.execute(
        sa.select(mind_nodes.c.id).where(mind_nodes.c.text == text)
    )
    row = res.first()
    if row:
        return row[0]
    node_id = f"mn_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(mind_nodes).values(
            id=node_id,
            text=text,
            category="link",
            color="#ffea94",
            source="link-game",
        )
    )
    return node_id


@router.post("/link-game/session")
async def log_link_session(
    session_data: LinkGameSession,
    session: AsyncSession = Depends(get_session),
):
    nodes_added = 0
    edges_added = 0

    for round_ in session_data.rounds:
        if round_.user_connection.strip() in ("--- timeout ---", "--- skip ---", ""):
            continue

        id_a = await _upsert_node(session, round_.conceptA)
        id_b = await _upsert_node(session, round_.conceptB)

        # Count newly inserted nodes (crude: check if id was freshly generated)
        # We just track totals at the session level instead
        nodes_added += 2  # approximate; upsert may reuse existing

        # Skip edge if it already exists (undirected)
        existing = await session.execute(
            sa.select(node_connections.c.id).where(
                ((node_connections.c.source_id == id_a) & (node_connections.c.target_id == id_b)) |
                ((node_connections.c.source_id == id_b) & (node_connections.c.target_id == id_a))
            )
        )
        if existing.first():
            continue

        edge_id = f"edge_{uuid.uuid4().hex[:8]}"
        await session.execute(
            sa.insert(node_connections).values(
                id=edge_id,
                source_id=id_a,
                target_id=id_b,
                strength=0.8,
                reason=round_.user_connection.strip(),
                kind="link-game",
            )
        )
        edges_added += 1

    await session.commit()
    return {
        "status": "success",
        "rounds_logged": len(session_data.rounds),
        "nodes_added": nodes_added,
        "edges_added": edges_added,
    }
