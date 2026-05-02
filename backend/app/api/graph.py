from __future__ import annotations
import uuid
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, mind_nodes, node_connections, skill_nodes
from app.models.graph import (
    MindNodeCreate, MindNodeResponse,
    NodeConnectionCreate, NodeConnectionResponse,
    GraphResponse
)

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
            node_connections.c.target_id, node_connections.c.strength
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
    
    # fetch created
    res = await session.execute(sa.select(mind_nodes).where(mind_nodes.c.id == node_id))
    created = res.first()
    return dict(created._mapping)

@router.post("/graph/connect", response_model=NodeConnectionResponse)
async def connect_nodes(conn: NodeConnectionCreate, session: AsyncSession = Depends(get_session)):
    # Check if edge already exists
    existing = await session.execute(
        sa.select(node_connections).where(
            ((node_connections.c.source_id == conn.source_id) & (node_connections.c.target_id == conn.target_id)) |
            ((node_connections.c.source_id == conn.target_id) & (node_connections.c.target_id == conn.source_id))
        )
    )
    
    # We allow duplicate directed edges, but let's assume undirected and prevent duplicate entirely for simplicity?
    # For now, just insert
    edge_id = f"edge_{uuid.uuid4().hex[:8]}"
    await session.execute(
        sa.insert(node_connections).values(
            id=edge_id,
            source_id=conn.source_id,
            target_id=conn.target_id,
            strength=conn.strength,
        )
    )
    await session.commit()
    
    return {
        "id": edge_id,
        "source_id": conn.source_id,
        "target_id": conn.target_id,
        "strength": conn.strength
    }

@router.post("/graph/sync")
async def sync_graph(session: AsyncSession = Depends(get_session)):
    """Sync skill nodes/edges into the mind graph without duplicates."""
    from app.services.mind_graph_sync import sync_mind_graph
    result = await sync_mind_graph(session)
    return result


@router.post("/graph/seed")
async def seed_graph_from_dna(session: AsyncSession = Depends(get_session)):
    """Auto-seed Mind Graph nodes from top skills if the graph is currently empty."""
    # Check if empty
    res = await session.execute(sa.select(mind_nodes.c.id).limit(1))
    if res.first():
        return {"seeded": False, "message": "Graph already has nodes."}
    
    from app.db.database import skill_edges
    
    # Get top 10 skills
    top_skills_res = await session.execute(
        sa.select(skill_nodes.c.id, skill_nodes.c.name, skill_nodes.c.category)
        .order_by(skill_nodes.c.level.desc())
        .limit(10)
    )
    rows = top_skills_res.fetchall()
    
    if not rows:
         return {"seeded": False, "message": "No DNA skills found."}

    id_map = {}
    inserted = 0
    for row in rows:
        old_id = row.id
        node_id = f"mn_{uuid.uuid4().hex[:8]}"
        id_map[old_id] = node_id
        await session.execute(
            sa.insert(mind_nodes).values(
                id=node_id,
                text=row.name,
                category=row.category or "learning",
                color="#82aaff",
                source="dna-import",
            )
        )
        inserted += 1
        
    edges_res = await session.execute(
        sa.select(skill_edges.c.source_id, skill_edges.c.target_id, skill_edges.c.strength)
        .where(
            skill_edges.c.source_id.in_(list(id_map.keys())) &
            skill_edges.c.target_id.in_(list(id_map.keys()))
        )
    )
    edge_rows = edges_res.fetchall()

    inserted_edges = 0
    for erow in edge_rows:
        edge_id = f"edge_{uuid.uuid4().hex[:8]}"
        await session.execute(
            sa.insert(node_connections).values(
                id=edge_id,
                source_id=id_map[erow.source_id],
                target_id=id_map[erow.target_id],
                strength=erow.strength,
            )
        )
        inserted_edges += 1
    
    await session.commit()
    return {"seeded": True, "count": inserted, "message": f"Seeded {inserted} nodes and {inserted_edges} edges from Creative DNA."}

