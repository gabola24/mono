from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, plans
from app.models.plan import (
    GeneratePlanRequest,
    PlanResponse,
    PlanStep,
    UpdateStepRequest,
)
from app.services.structured_output import generate_plan
from app.services.rag_pipeline import retrieve_context, format_context_for_prompt

router = APIRouter(tags=["plans"])


def _row_to_response(row) -> PlanResponse:
    steps = json.loads(row.steps_json)
    return PlanResponse(
        id=row.id,
        title=row.title,
        summary=row.summary,
        steps=[PlanStep(**s) for s in steps],
        source_message=row.source_message,
        created_at=str(row.created_at),
    )


@router.post("/plans/generate", response_model=PlanResponse)
async def create_plan(
    req: GeneratePlanRequest,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    refs = await retrieve_context(req.topic, user_id, n_results=3)
    rag_context = format_context_for_prompt(refs) if refs else ""
    context = req.context + ("\n" + rag_context if rag_context else "")

    result = await generate_plan(req.topic, context)

    plan_id = str(uuid.uuid4())
    steps = result.get("steps", [])
    for i, step in enumerate(steps):
        step.setdefault("order", i + 1)
        step.setdefault("done", False)

    now = datetime.now(timezone.utc)
    await session.execute(
        plans.insert().values(
            id=plan_id,
            user_id=user_id,
            title=result.get("title", req.topic[:60]),
            summary=result.get("summary", ""),
            steps_json=json.dumps(steps),
            source_message=req.topic,
            created_at=now,
        )
    )
    await session.commit()

    return PlanResponse(
        id=plan_id,
        title=result.get("title", req.topic[:60]),
        summary=result.get("summary", ""),
        steps=[PlanStep(**s) for s in steps],
        source_message=req.topic,
        created_at=now.isoformat(),
    )


@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    result = await session.execute(
        sa.select(plans)
        .where(plans.c.user_id == user_id)
        .order_by(plans.c.created_at.desc())
    )
    return [_row_to_response(row) for row in result.fetchall()]


@router.patch("/plans/{plan_id}/step")
async def update_step(
    plan_id: str,
    req: UpdateStepRequest,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    result = await session.execute(
        sa.select(plans.c.steps_json).where(
            plans.c.id == plan_id, plans.c.user_id == user_id
        )
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(404, "Plan not found")

    steps = json.loads(row.steps_json)
    for step in steps:
        if step["order"] == req.step_order:
            step["done"] = req.done
            break

    await session.execute(
        sa.update(plans)
        .where(plans.c.id == plan_id, plans.c.user_id == user_id)
        .values(steps_json=json.dumps(steps))
    )
    await session.commit()
    return {"status": "updated"}


@router.delete("/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    await session.execute(
        sa.delete(plans).where(plans.c.id == plan_id, plans.c.user_id == user_id)
    )
    await session.commit()
    return {"status": "deleted"}
