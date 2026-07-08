from __future__ import annotations
import asyncio
import uuid
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, mind_nodes, node_connections, skill_nodes, skill_edges, users
from app.models.graph import (
    MindNodeCreate, MindNodeResponse,
    NodeConnectionCreate, NodeConnectionResponse,
    GraphResponse
)
from app.services.edge_reasoning import generate_edge_reason

router = APIRouter(tags=["graph"])


FREE_NODE_LIMIT = 10


@router.get("/graph", response_model=GraphResponse)
async def get_graph(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    # Determine tier
    tier_row = await session.execute(
        sa.select(users.c.subscription_tier).where(users.c.id == user_id)
    )
    is_pro = (tier_row.scalar_one_or_none() or "free") == "pro"

    # Total node count for truncation hint
    count_res = await session.execute(
        sa.select(sa.func.count()).select_from(mind_nodes).where(mind_nodes.c.user_id == user_id)
    )
    total_count = count_res.scalar() or 0

    nodes_query = sa.select(
        mind_nodes.c.id, mind_nodes.c.text, mind_nodes.c.category,
        mind_nodes.c.color, mind_nodes.c.source, mind_nodes.c.created_at
    ).where(mind_nodes.c.user_id == user_id).order_by(mind_nodes.c.created_at.desc())

    if not is_pro:
        nodes_query = nodes_query.limit(FREE_NODE_LIMIT)

    nodes_result = await session.execute(nodes_query)
    nodes_data = [dict(r._mapping) for r in nodes_result.fetchall()]
    truncated = not is_pro and total_count > FREE_NODE_LIMIT

    # Only return edges between visible nodes
    if truncated:
        visible_ids = [n["id"] for n in nodes_data]
        edges_result = await session.execute(
            sa.select(
                node_connections.c.id, node_connections.c.source_id,
                node_connections.c.target_id, node_connections.c.strength,
                node_connections.c.reason, node_connections.c.kind,
                node_connections.c.created_at,
            ).where(
                node_connections.c.user_id == user_id,
                node_connections.c.source_id.in_(visible_ids),
                node_connections.c.target_id.in_(visible_ids),
            )
        )
    else:
        edges_result = await session.execute(
            sa.select(
                node_connections.c.id, node_connections.c.source_id,
                node_connections.c.target_id, node_connections.c.strength,
                node_connections.c.reason, node_connections.c.kind,
                node_connections.c.created_at,
            ).where(node_connections.c.user_id == user_id)
        )
    edges_data = [dict(r._mapping) for r in edges_result.fetchall()]

    return GraphResponse(
        nodes=nodes_data,
        edges=edges_data,
        truncated=truncated,
        total_count=total_count,
    )


@router.post("/graph/nodes", response_model=MindNodeResponse)
async def create_node(
    node: MindNodeCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    node_id = f"mn_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(mind_nodes).values(
            id=node_id,
            user_id=user_id,
            text=node.text,
            category=node.category,
            color=node.color,
            source=node.source,
        )
    )
    await session.commit()
    res = await session.execute(
        sa.select(mind_nodes).where(mind_nodes.c.id == node_id)
    )
    created = res.first()
    return dict(created._mapping)


@router.post("/graph/connect", response_model=NodeConnectionResponse)
async def connect_nodes(
    conn: NodeConnectionCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    existing = await session.execute(
        sa.select(node_connections.c.id).where(
            node_connections.c.user_id == user_id,
            (
                ((node_connections.c.source_id == conn.source_id) & (node_connections.c.target_id == conn.target_id)) |
                ((node_connections.c.source_id == conn.target_id) & (node_connections.c.target_id == conn.source_id))
            ),
        )
    )
    if existing.first():
        raise HTTPException(status_code=409, detail="Edge already exists between these nodes.")

    node_texts: dict[str, str] = {}
    for nid in (conn.source_id, conn.target_id):
        row = await session.execute(
            sa.select(mind_nodes.c.text).where(
                mind_nodes.c.id == nid, mind_nodes.c.user_id == user_id
            )
        )
        r = row.first()
        if r:
            node_texts[nid] = r[0]

    reason = conn.reason
    if reason is None and len(node_texts) == 2:
        reason = await generate_edge_reason(
            node_texts[conn.source_id], node_texts[conn.target_id]
        )

    edge_id = f"edge_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(node_connections).values(
            id=edge_id,
            user_id=user_id,
            source_id=conn.source_id,
            target_id=conn.target_id,
            strength=conn.strength,
            reason=reason,
            kind=conn.kind or "manual",
        )
    )
    await session.commit()
    return {
        "id": edge_id,
        "source_id": conn.source_id,
        "target_id": conn.target_id,
        "strength": conn.strength,
        "reason": reason,
        "kind": conn.kind or "manual",
        "created_at": None,
    }


@router.post("/graph/sync")
async def sync_graph(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    from app.services.mind_graph_sync import sync_mind_graph
    result = await sync_mind_graph(session, user_id)
    return result


@router.post("/graph/seed")
async def seed_graph_from_dna(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    res = await session.execute(
        sa.select(mind_nodes.c.id).where(mind_nodes.c.user_id == user_id).limit(1)
    )
    if res.first():
        return {"seeded": False, "message": "Graph already has nodes."}

    top_skills_res = await session.execute(
        sa.select(skill_nodes.c.id, skill_nodes.c.name, skill_nodes.c.category)
        .where(skill_nodes.c.user_id == user_id)
        .order_by(skill_nodes.c.level.desc())
        .limit(10)
    )
    rows = top_skills_res.fetchall()
    if not rows:
        return {"seeded": False, "message": "No DNA skills found."}

    id_map: dict[str, str] = {}
    for row in rows:
        node_id = f"mn_{uuid.uuid4().hex[:8]}"
        id_map[row.id] = node_id
        await session.execute(
            sa.insert(mind_nodes).values(
                id=node_id,
                user_id=user_id,
                text=row.name,
                category=row.category or "learning",
                color="#82aaff",
                source="dna-import",
            )
        )

    skill_name_map = {row.id: row.name for row in rows}

    edges_res = await session.execute(
        sa.select(
            skill_edges.c.source_id, skill_edges.c.target_id,
            skill_edges.c.strength, skill_edges.c.reason
        ).where(
            skill_edges.c.user_id == user_id,
            skill_edges.c.source_id.in_(list(id_map.keys())),
            skill_edges.c.target_id.in_(list(id_map.keys())),
        )
    )

    inserted_edges = 0
    for erow in edges_res.fetchall():
        src_name = skill_name_map.get(erow.source_id, "")
        tgt_name = skill_name_map.get(erow.target_id, "")
        reason = await generate_edge_reason(src_name, tgt_name, hint=erow.reason)
        edge_id = f"edge_{uuid.uuid4().hex[:8]}"
        await session.execute(
            sa.insert(node_connections).values(
                id=edge_id,
                user_id=user_id,
                source_id=id_map[erow.source_id],
                target_id=id_map[erow.target_id],
                strength=erow.strength,
                reason=reason,
                kind="dna",
            )
        )
        inserted_edges += 1

    await session.commit()
    return {
        "seeded": True,
        "count": len(rows),
        "message": f"Seeded {len(rows)} nodes and {inserted_edges} edges from Creative DNA.",
    }


@router.post("/graph/reasons/backfill")
async def backfill_edge_reasons(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    """Generate reasoning for all edges that currently have reason=NULL."""
    missing_res = await session.execute(
        sa.select(
            node_connections.c.id,
            node_connections.c.source_id,
            node_connections.c.target_id,
        ).where(
            node_connections.c.user_id == user_id,
            node_connections.c.reason.is_(None),
        )
    )
    missing = missing_res.fetchall()
    if not missing:
        return {"updated": 0, "skipped": 0}

    node_res = await session.execute(
        sa.select(mind_nodes.c.id, mind_nodes.c.text).where(mind_nodes.c.user_id == user_id)
    )
    text_map: dict[str, str] = {row.id: row.text for row in node_res.fetchall()}

    updated = 0
    skipped = 0

    async def _fill_one(edge_id: str, src_id: str, tgt_id: str) -> tuple[str, str | None]:
        a = text_map.get(src_id)
        b = text_map.get(tgt_id)
        if not a or not b:
            return edge_id, None
        return edge_id, await generate_edge_reason(a, b)

    chunk_size = 5
    for i in range(0, len(missing), chunk_size):
        chunk = missing[i:i + chunk_size]
        results = await asyncio.gather(*[_fill_one(r.id, r.source_id, r.target_id) for r in chunk])
        for edge_id, reason in results:
            if reason:
                await session.execute(
                    sa.update(node_connections)
                    .where(node_connections.c.id == edge_id)
                    .values(reason=reason)
                )
                updated += 1
            else:
                skipped += 1

    await session.commit()
    return {"updated": updated, "skipped": skipped}
