from __future__ import annotations
import sqlalchemy as sa
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session, daily_stats
from app.models.stats import DailyStatCreate, DailyStatResponse, StatsHistoryResponse
from app.services.streak import get_streak_info

router = APIRouter(tags=["stats"])

@router.post("/stats/checkin", response_model=DailyStatResponse)
async def checkin_daily_stats(
    stat: DailyStatCreate, 
    session: AsyncSession = Depends(get_session)
):
    today = date.today()

    # Check if a check-in already exists for today
    result = await session.execute(
        sa.select(daily_stats).where(daily_stats.c.date == today)
    )
    existing = result.first()

    if existing:
        # Update existing
        await session.execute(
            sa.update(daily_stats)
            .where(daily_stats.c.date == today)
            .values(
                energy=stat.energy,
                focus=stat.focus,
                mood=stat.mood,
                creative=stat.creative,
            )
        )
        row_id = existing.id
    else:
        # Insert new
        result = await session.execute(
            sa.insert(daily_stats).values(
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
async def get_stats_history(limit: int = 7, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        sa.select(daily_stats)
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

    streak_info = await get_streak_info(session)
    streak = streak_info.get("current_streak", 0)

    return StatsHistoryResponse(stats=stats, streak=streak)
