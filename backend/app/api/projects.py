from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, projects, project_notes
from app.models.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectNoteRequest,
    ProjectLinkRequest,
    ProjectResponse,
    ProjectNoteResponse,
)

router = APIRouter(tags=["projects"])


def _parse_json_list(val: str | None) -> list[str]:
    if not val:
        return []
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return []


async def _build_response(session: AsyncSession, row) -> ProjectResponse:
    notes_result = await session.execute(
        sa.select(project_notes)
        .where(project_notes.c.project_id == row.id)
        .order_by(project_notes.c.created_at.desc())
    )
    notes = [
        ProjectNoteResponse(
            id=n.id, project_id=n.project_id, content=n.content,
            note_type=n.note_type, created_at=str(n.created_at),
        )
        for n in notes_result.fetchall()
    ]
    return ProjectResponse(
        id=row.id, title=row.title, description=row.description,
        status=row.status, priority=row.priority,
        plan_ids=_parse_json_list(row.plan_ids_json),
        reference_ids=_parse_json_list(row.reference_ids_json),
        notes=notes,
        created_at=str(row.created_at), updated_at=str(row.updated_at),
    )


@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    req: ProjectCreateRequest, session: AsyncSession = Depends(get_session)
):
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await session.execute(
        projects.insert().values(
            id=project_id,
            title=req.title,
            description=req.description,
            status=req.status,
            priority=req.priority,
            plan_ids_json="[]",
            reference_ids_json="[]",
            created_at=now,
            updated_at=now,
        )
    )
    await session.commit()

    result = await session.execute(
        sa.select(projects).where(projects.c.id == project_id)
    )
    return await _build_response(session, result.fetchone())


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        sa.select(projects).order_by(projects.c.priority, projects.c.updated_at.desc())
    )
    return [await _build_response(session, row) for row in result.fetchall()]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        sa.select(projects).where(projects.c.id == project_id)
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(404, "Project not found")
    return await _build_response(session, row)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    req: ProjectUpdateRequest,
    session: AsyncSession = Depends(get_session),
):
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if req.title is not None:
        updates["title"] = req.title
    if req.description is not None:
        updates["description"] = req.description
    if req.status is not None:
        updates["status"] = req.status
    if req.priority is not None:
        updates["priority"] = req.priority

    await session.execute(
        projects.update().where(projects.c.id == project_id).values(**updates)
    )
    await session.commit()

    result = await session.execute(
        sa.select(projects).where(projects.c.id == project_id)
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(404, "Project not found")
    return await _build_response(session, row)


@router.delete("/projects/{project_id}")
async def archive_project(project_id: str, session: AsyncSession = Depends(get_session)):
    await session.execute(
        projects.update()
        .where(projects.c.id == project_id)
        .values(status="archived", updated_at=datetime.now(timezone.utc))
    )
    await session.commit()
    return {"status": "archived"}


@router.post("/projects/{project_id}/notes", response_model=ProjectNoteResponse)
async def add_note(
    project_id: str,
    req: ProjectNoteRequest,
    session: AsyncSession = Depends(get_session),
):
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await session.execute(
        project_notes.insert().values(
            id=note_id,
            project_id=project_id,
            content=req.content,
            note_type=req.note_type,
            created_at=now,
        )
    )
    await session.execute(
        projects.update()
        .where(projects.c.id == project_id)
        .values(updated_at=now)
    )
    await session.commit()
    return ProjectNoteResponse(
        id=note_id, project_id=project_id, content=req.content,
        note_type=req.note_type, created_at=now.isoformat(),
    )


@router.post("/projects/{project_id}/link")
async def link_to_project(
    project_id: str,
    req: ProjectLinkRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        sa.select(projects).where(projects.c.id == project_id)
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(404, "Project not found")

    now = datetime.now(timezone.utc)

    if req.link_type == "plan":
        ids = _parse_json_list(row.plan_ids_json)
        if req.link_id not in ids:
            ids.append(req.link_id)
        await session.execute(
            projects.update()
            .where(projects.c.id == project_id)
            .values(plan_ids_json=json.dumps(ids), updated_at=now)
        )
    elif req.link_type == "reference":
        ids = _parse_json_list(row.reference_ids_json)
        if req.link_id not in ids:
            ids.append(req.link_id)
        await session.execute(
            projects.update()
            .where(projects.c.id == project_id)
            .values(reference_ids_json=json.dumps(ids), updated_at=now)
        )
    else:
        raise HTTPException(400, "link_type must be 'plan' or 'reference'")

    await session.commit()
    return {"status": "linked"}
