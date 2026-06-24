from __future__ import annotations
import uuid

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, mind_nodes, node_connections
from app.models.graph import LinkGameRound, LinkGameSession

router = APIRouter()


async def _upsert_node(session: AsyncSession, text: str, user_id: str) -> str:
    """Return id of existing node with this text for this user, or insert and return new id."""
    res = await session.execute(
        sa.select(mind_nodes.c.id).where(
            mind_nodes.c.text == text, mind_nodes.c.user_id == user_id
        )
    )
    row = res.first()
    if row:
        return row[0]
    node_id = f"mn_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(mind_nodes).values(
            id=node_id,
            user_id=user_id,
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
    user_id: str = Depends(get_current_user),
):
    nodes_added = 0
    edges_added = 0

    for round_ in session_data.rounds:
        if round_.user_connection.strip() in ("--- timeout ---", "--- skip ---", ""):
            continue

        id_a = await _upsert_node(session, round_.conceptA, user_id)
        id_b = await _upsert_node(session, round_.conceptB, user_id)

        nodes_added += 2

        existing = await session.execute(
            sa.select(node_connections.c.id).where(
                node_connections.c.user_id == user_id,
                (
                    ((node_connections.c.source_id == id_a) & (node_connections.c.target_id == id_b)) |
                    ((node_connections.c.source_id == id_b) & (node_connections.c.target_id == id_a))
                ),
            )
        )
        if existing.first():
            continue

        edge_id = f"edge_{uuid.uuid4().hex[:8]}"
        await session.execute(
            sa.insert(node_connections).values(
                id=edge_id,
                user_id=user_id,
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
