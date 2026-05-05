from __future__ import annotations
import asyncio
import uuid
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, mind_nodes, node_connections, skill_nodes, skill_edges
from app.models.graph import (
    MindNodeCreate, MindNodeResponse,
    NodeConnectionCreate, NodeConnectionResponse,
    GraphResponse
)
from app.services.edge_reasoning import generate_edge_reason

router = APIRouter(tags=["graph"])


@router.get("/graph", response_model=GraphResponse)
async def get_graph(session: AsyncSession = Depends(get_session)):
    nodes_result = await session.execute(
        sa.select(
            mind_nodes.c.id, mind_nodes.c.text, mind_nodes.c.category,
            mind_nodes.c.color, mind_nodes.c.source, mind_nodes.c.created_at
        )
    )
    nodes_data = [dict(r._mapping) for r in nodes_result.fetchall()]

    edges_result = await session.execute(
        sa.select(
            node_connections.c.id, node_connections.c.source_id,
            node_connections.c.target_id, node_connections.c.strength,
            node_connections.c.reason, node_connections.c.kind,
            node_connections.c.created_at
        )
    )
    edges_data = [dict(r._mapping) for r in edges_result.fetchall()]

    return GraphResponse(nodes=nodes_data, edges=edges_data)


@router.post("/graph/nodes", response_model=MindNodeResponse)
async def create_node(node: MindNodeCreate, session: AsyncSession = Depends(get_session)):
    node_id = f"mn_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(mind_nodes).values(
            id=node_id,
            text=node.text,
            category=node.category,
            color=node.color,
            source=node.source,
        )
    )
    await session.commit()
    res = await session.execute(sa.select(mind_nodes).where(mind_nodes.c.id == node_id))
    created = res.first()
    return dict(created._mapping)


@router.post("/graph/connect", response_model=NodeConnectionResponse)
async def connect_nodes(conn: NodeConnectionCreate, session: AsyncSession = Depends(get_session)):
    existing = await session.execute(
        sa.select(node_connections.c.id).where(
            ((node_connections.c.source_id == conn.source_id) & (node_connections.c.target_id == conn.target_id)) |
            ((node_connections.c.source_id == conn.target_id) & (node_connections.c.target_id == conn.source_id))
        )
    )
    if existing.first():
        raise HTTPException(status_code=409, detail="Edge already exists between these nodes.")

    # Fetch node texts to generate a reason
    node_texts: dict[str, str] = {}
    for nid in (conn.source_id, conn.target_id):
        row = await session.execute(sa.select(mind_nodes.c.text).where(mind_nodes.c.id == nid))
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
async def sync_graph(session: AsyncSession = Depends(get_session)):
    from app.services.mind_graph_sync import sync_mind_graph
    result = await sync_mind_graph(session)
    return result


@router.post("/graph/seed")
async def seed_graph_from_dna(session: AsyncSession = Depends(get_session)):
    res = await session.execute(sa.select(mind_nodes.c.id).limit(1))
    if res.first():
        return {"seeded": False, "message": "Graph already has nodes."}

    top_skills_res = await session.execute(
        sa.select(skill_nodes.c.id, skill_nodes.c.name, skill_nodes.c.category)
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
            skill_edges.c.source_id.in_(list(id_map.keys())) &
            skill_edges.c.target_id.in_(list(id_map.keys()))
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
async def backfill_edge_reasons(session: AsyncSession = Depends(get_session)):
    """Generate reasoning for all edges that currently have reason=NULL."""
    missing_res = await session.execute(
        sa.select(
            node_connections.c.id,
            node_connections.c.source_id,
            node_connections.c.target_id,
        ).where(node_connections.c.reason.is_(None))
    )
    missing = missing_res.fetchall()
    if not missing:
        return {"updated": 0, "skipped": 0}

    # Fetch all node texts in one query
    node_res = await session.execute(sa.select(mind_nodes.c.id, mind_nodes.c.text))
    text_map: dict[str, str] = {row.id: row.text for row in node_res.fetchall()}

    updated = 0
    skipped = 0

    async def _fill_one(edge_id: str, src_id: str, tgt_id: str) -> tuple[str, str | None]:
        a = text_map.get(src_id)
        b = text_map.get(tgt_id)
        if not a or not b:
            return edge_id, None
        return edge_id, await generate_edge_reason(a, b)

    # Process in chunks of 5 to bound concurrency
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
