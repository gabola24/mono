from __future__ import annotations
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.chat import router as chat_router
from app.api.references import router as references_router
from app.api.activity import router as activity_router
from app.api.plans import router as plans_router
from app.api.habits import router as habits_router
from app.api.profile import router as profile_router
from app.api.projects import router as projects_router
from app.api.skills import router as skills_router
from app.api.companion import router as companion_router
from app.api.stats import router as stats_router
from app.api.graph import router as graph_router
from app.api.link_game import router as link_game_router
from app.config import settings

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic — run `alembic upgrade head` before starting.
    UPLOAD_DIR.mkdir(exist_ok=True)
    yield


app = FastAPI(title="Zukuri", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(references_router, prefix="/api")
app.include_router(activity_router, prefix="/api")
app.include_router(plans_router, prefix="/api")
app.include_router(habits_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(skills_router, prefix="/api")
app.include_router(companion_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(link_game_router, prefix="/api")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
