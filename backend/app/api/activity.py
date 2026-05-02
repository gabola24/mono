from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.services.streak import record_activity, get_streak_info

router = APIRouter(tags=["activity"])


@router.post("/activity/checkin")
async def checkin(session: AsyncSession = Depends(get_session)):
    await record_activity(session)
    return await get_streak_info(session)


@router.get("/activity/streak")
async def streak(session: AsyncSession = Depends(get_session)):
    return await get_streak_info(session)
