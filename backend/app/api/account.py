from __future__ import annotations

import httpx
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.db.database import (
    get_session,
    users,
    conversations,
    messages,
    references,
    activity_log,
    daily_stats,
    plans,
    habits,
    habit_logs,
    skill_nodes,
    skill_edges,
    skill_badges,
    mind_nodes,
    node_connections,
    projects,
    project_notes,
    usage_log,
)

router = APIRouter(tags=["account"])

# FK-respecting delete order (children before parents)
_TABLES_BY_USER = [
    messages,
    activity_log,
    daily_stats,
    usage_log,
    plans,
    habit_logs,
    habits,
    skill_edges,
    skill_badges,
    skill_nodes,
    node_connections,
    mind_nodes,
    project_notes,
    projects,
    references,
    conversations,
]


@router.post("/account/delete")
async def delete_account(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    # Grab Clerk ID before deletion
    row = await session.execute(
        sa.select(users.c.clerk_user_id).where(users.c.id == user_id)
    )
    clerk_user_id = row.scalar_one_or_none()

    for table in _TABLES_BY_USER:
        await session.execute(sa.delete(table).where(table.c.user_id == user_id))
    await session.execute(sa.delete(users).where(users.c.id == user_id))
    await session.commit()

    # Best-effort Clerk deletion
    if clerk_user_id and settings.clerk_secret_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.delete(
                    f"https://api.clerk.com/v1/users/{clerk_user_id}",
                    headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                )
        except Exception:
            pass

    return {"deleted": True}


@router.get("/account/export")
async def export_account(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    async def _rows(table, *cols, order_col=None):
        q = sa.select(*cols).where(table.c.user_id == user_id)
        if order_col is not None:
            q = q.order_by(order_col)
        res = await session.execute(q)
        return [dict(r._mapping) for r in res.fetchall()]

    data = {
        "messages": await _rows(
            messages,
            messages.c.role, messages.c.content, messages.c.created_at,
            order_col=messages.c.created_at,
        ),
        "references": await _rows(
            references,
            references.c.type, references.c.title, references.c.content, references.c.created_at,
        ),
        "plans": await _rows(
            plans,
            plans.c.title, plans.c.summary, plans.c.steps_json, plans.c.created_at,
        ),
        "habits": await _rows(
            habits,
            habits.c.name, habits.c.frequency, habits.c.active, habits.c.created_at,
        ),
        "projects": await _rows(
            projects,
            projects.c.title, projects.c.description, projects.c.status, projects.c.created_at,
        ),
        "project_notes": await _rows(
            project_notes,
            project_notes.c.content, project_notes.c.note_type, project_notes.c.created_at,
        ),
        "activity_log": await _rows(
            activity_log,
            activity_log.c.date,
        ),
        "daily_stats": await _rows(
            daily_stats,
            daily_stats.c.date, daily_stats.c.energy, daily_stats.c.focus,
            daily_stats.c.mood, daily_stats.c.creative,
        ),
        "skill_nodes": await _rows(
            skill_nodes,
            skill_nodes.c.name, skill_nodes.c.category, skill_nodes.c.xp,
            skill_nodes.c.level, skill_nodes.c.created_at,
        ),
        "mind_nodes": await _rows(
            mind_nodes,
            mind_nodes.c.text, mind_nodes.c.category, mind_nodes.c.source, mind_nodes.c.created_at,
        ),
    }

    return JSONResponse(
        content=_jsonify(data),
        headers={"Content-Disposition": 'attachment; filename="zukuri-export.json"'},
    )


def _jsonify(obj):
    """Convert dates/datetimes to ISO strings for JSON serialization."""
    import datetime
    if isinstance(obj, dict):
        return {k: _jsonify(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_jsonify(v) for v in obj]
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    return obj
