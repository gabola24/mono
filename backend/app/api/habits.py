from __future__ import annotations
import uuid
from datetime import date, datetime, timedelta, timezone

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, habits, habit_logs
from app.models.plan import HabitCreateRequest, HabitResponse

router = APIRouter(tags=["habits"])


async def _compute_streak(session: AsyncSession, habit_id: str) -> int:
    result = await session.execute(
        sa.select(habit_logs.c.date)
        .where(habit_logs.c.habit_id == habit_id)
        .order_by(habit_logs.c.date.desc())
    )
    dates = [row.date for row in result.fetchall()]
    if not dates:
        return 0

    streak = 0
    check = date.today()
    for d in dates:
        d = d if isinstance(d, date) else date.fromisoformat(str(d))
        if d == check:
            streak += 1
            check -= timedelta(days=1)
        elif d < check:
            break
    return streak


async def _to_response(session: AsyncSession, row) -> HabitResponse:
    streak = await _compute_streak(session, row.id)
    today_check = await session.execute(
        sa.select(habit_logs.c.id).where(
            habit_logs.c.habit_id == row.id,
            habit_logs.c.date == date.today(),
        )
    )
    return HabitResponse(
        id=row.id,
        name=row.name,
        frequency=row.frequency,
        active=row.active,
        created_at=str(row.created_at),
        streak=streak,
        completed_today=today_check.scalar_one_or_none() is not None,
    )


@router.post("/habits", response_model=HabitResponse)
async def create_habit(
    req: HabitCreateRequest,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    habit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await session.execute(
        habits.insert().values(
            id=habit_id, user_id=user_id, name=req.name,
            frequency=req.frequency, active=True, created_at=now,
        )
    )
    await session.commit()

    result = await session.execute(sa.select(habits).where(habits.c.id == habit_id))
    return await _to_response(session, result.fetchone())


@router.get("/habits", response_model=list[HabitResponse])
async def list_habits(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    result = await session.execute(
        sa.select(habits)
        .where(habits.c.active == True, habits.c.user_id == user_id)
        .order_by(habits.c.created_at)
    )
    return [await _to_response(session, row) for row in result.fetchall()]


@router.post("/habits/{habit_id}/check")
async def check_habit(
    habit_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    today = date.today()
    existing = await session.execute(
        sa.select(habit_logs.c.id).where(
            habit_logs.c.habit_id == habit_id,
            habit_logs.c.date == today,
        )
    )
    if existing.scalar_one_or_none():
        await session.execute(
            sa.delete(habit_logs).where(
                habit_logs.c.habit_id == habit_id,
                habit_logs.c.date == today,
            )
        )
        await session.commit()
        return {"checked": False}

    await session.execute(
        habit_logs.insert().values(habit_id=habit_id, user_id=user_id, date=today)
    )
    await session.commit()
    return {"checked": True}


@router.delete("/habits/{habit_id}")
async def delete_habit(
    habit_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    await session.execute(
        sa.update(habits)
        .where(habits.c.id == habit_id, habits.c.user_id == user_id)
        .values(active=False)
    )
    await session.commit()
    return {"status": "archived"}
