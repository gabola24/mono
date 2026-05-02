from pydantic import BaseModel
from datetime import date

class DailyStatCreate(BaseModel):
    energy: int  # 0-100
    focus: int   # 0-100
    mood: int    # 0-100
    creative: int # 0-100

class DailyStatResponse(BaseModel):
    id: int
    date: date
    energy: int
    focus: int
    mood: int
    creative: int

class StatsHistoryResponse(BaseModel):
    stats: list[DailyStatResponse]
    streak: int
