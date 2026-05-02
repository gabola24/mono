from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter()

class LinkRound(BaseModel):
    conceptA: str
    conceptB: str
    user_connection: str

class LinkSession(BaseModel):
    rounds: List[LinkRound]
    total_time_ms: int
    date: str

# In a real app we'd save this to DB, for now we log it or save to a file/DB
# For Zukuri Week 4 tasks, simple POST endpoint for logging is sufficient
@router.post("/link-game/session")
async def log_link_session(session: LinkSession):
    print(f"[LINK GAME] Submitting session with {len(session.rounds)} rounds completed in {session.total_time_ms}ms.")
    return {"status": "success", "message": "Link session logged."}
