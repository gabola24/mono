from __future__ import annotations
import sqlalchemy as sa
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, daily_stats
from app.models.stats import DailyStatCreate, DailyStatResponse, StatsHistoryResponse
from app.services.streak import get_streak_info

router = APIRouter(tags=["stats"])


@router.post("/stats/checkin", response_model=DailyStatResponse)
async def checkin_daily_stats(
    stat: DailyStatCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    today = date.today()

    result = await session.execute(
        sa.select(daily_stats).where(
            daily_stats.c.date == today, daily_stats.c.user_id == user_id
        )
    )
    existing = result.first()

    if existing:
        await session.execute(
            sa.update(daily_stats)
            .where(daily_stats.c.date == today, daily_stats.c.user_id == user_id)
            .values(
                energy=stat.energy,
                focus=stat.focus,
                mood=stat.mood,
                creative=stat.creative,
            )
        )
        row_id = existing.id
    else:
        result = await session.execute(
            sa.insert(daily_stats).values(
                user_id=user_id,
                date=today,
                energy=stat.energy,
                focus=stat.focus,
                mood=stat.mood,
                creative=stat.creative,
            )
        )
        row_id = result.inserted_primary_key[0]

    await session.commit()

    return DailyStatResponse(
        id=row_id,
        date=today,
        energy=stat.energy,
        focus=stat.focus,
        mood=stat.mood,
        creative=stat.creative,
    )


@router.get("/stats/history", response_model=StatsHistoryResponse)
async def get_stats_history(
    limit: int = 7,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    result = await session.execute(
        sa.select(daily_stats)
        .where(daily_stats.c.user_id == user_id)
        .order_by(daily_stats.c.date.desc())
        .limit(limit)
    )

    rows = result.fetchall()
    stats = [
        DailyStatResponse(
            id=row.id,
            date=row.date,
            energy=row.energy,
            focus=row.focus,
            mood=row.mood,
            creative=row.creative,
        )
        for row in rows
    ]

    streak_info = await get_streak_info(session, user_id)
    streak = streak_info.get("current_streak", 0)

    return StatsHistoryResponse(stats=stats, streak=streak)
