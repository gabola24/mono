from __future__ import annotations
from datetime import date

import sqlalchemy as sa
from fastapi import HTTPException
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import users, usage_log

FREE_DAILY_MESSAGES = 20
PRO_DAILY_MESSAGES = 500


async def _get_tier(session: AsyncSession, user_id: str) -> str:
    row = await session.execute(
        sa.select(users.c.subscription_tier).where(users.c.id == user_id)
    )
    return row.scalar_one_or_none() or "free"


async def check_and_increment_messages(session: AsyncSession, user_id: str) -> None:
    """Enforce daily message quota then increment. Raises HTTP 402 if over limit."""
    tier = await _get_tier(session, user_id)
    limit = PRO_DAILY_MESSAGES if tier == "pro" else FREE_DAILY_MESSAGES

    today = date.today()
    count_row = await session.execute(
        sa.select(usage_log.c.message_count).where(
            usage_log.c.user_id == user_id,
            usage_log.c.date == today,
        )
    )
    current = count_row.scalar_one_or_none() or 0

    if current >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"Daily limit of {limit} messages reached. Upgrade to Pro for more.",
        )

    stmt = (
        pg_insert(usage_log)
        .values(user_id=user_id, date=today, message_count=1, image_count=0)
        .on_conflict_do_update(
            index_elements=["user_id", "date"],
            set_={"message_count": usage_log.c.message_count + 1},
        )
    )
    await session.execute(stmt)
    await session.commit()
