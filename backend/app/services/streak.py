from __future__ import annotations
from datetime import date, timedelta

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import activity_log


async def record_activity(session: AsyncSession, user_id: str) -> None:
    today = date.today()
    existing = await session.execute(
        sa.select(activity_log.c.id).where(
            activity_log.c.user_id == user_id,
            activity_log.c.date == today,
        )
    )
    if existing.scalar_one_or_none():
        return
    await session.execute(activity_log.insert().values(user_id=user_id, date=today))
    await session.commit()


async def get_streak_info(session: AsyncSession, user_id: str) -> dict:
    result = await session.execute(
        sa.select(activity_log.c.date)
        .where(activity_log.c.user_id == user_id)
        .order_by(activity_log.c.date.desc())
    )
    dates = [row.date for row in result.fetchall()]

    if not dates:
        return {"current_streak": 0, "longest_streak": 0, "total_days": 0}

    today = date.today()
    current_streak = 0
    check_date = today

    for d in dates:
        if isinstance(d, str):
            d = date.fromisoformat(d)
        if d == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        elif d < check_date:
            break

    longest = 0
    streak = 1
    for i in range(1, len(dates)):
        d_curr = dates[i - 1] if isinstance(dates[i - 1], date) else date.fromisoformat(dates[i - 1])
        d_prev = dates[i] if isinstance(dates[i], date) else date.fromisoformat(dates[i])
        if d_curr - d_prev == timedelta(days=1):
            streak += 1
        else:
            longest = max(longest, streak)
            streak = 1
    longest = max(longest, streak)

    return {
        "current_streak": current_streak,
        "longest_streak": longest,
        "total_days": len(dates),
    }
