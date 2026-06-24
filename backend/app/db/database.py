from __future__ import annotations
from sqlalchemy import event
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from pgvector.sqlalchemy import Vector

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Register pgvector codec for asyncpg connections
@event.listens_for(engine.sync_engine, "connect")
def _register_vector(dbapi_conn, _):
    from pgvector.asyncpg import register_vector
    dbapi_conn.run_sync(register_vector)

metadata = sa.MetaData()

# ─── Users ──────────────────────────────────────────

users = sa.Table(
    "users",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("clerk_user_id", sa.String, nullable=True, unique=True),
    sa.Column("email", sa.String, nullable=True),
    sa.Column("subscription_tier", sa.String, nullable=False, server_default="free"),
    sa.Column("stripe_customer_id", sa.String, nullable=True),
    sa.Column("onboarded", sa.Boolean, nullable=False, server_default="false"),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── Conversations ───────────────────────────────────

conversations = sa.Table(
    "conversations",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("title", sa.String, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

messages = sa.Table(
    "messages",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("conversation_id", sa.String, sa.ForeignKey("conversations.id")),
    sa.Column("role", sa.String, nullable=False),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── References ─────────────────────────────────────

references = sa.Table(
    "references",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("type", sa.String, nullable=False),
    sa.Column("title", sa.String, nullable=False),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("file_path", sa.String, nullable=True),
    sa.Column("embedding", Vector(1536), nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── Activity ────────────────────────────────────────

activity_log = sa.Table(
    "activity_log",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("date", sa.Date, nullable=False),
    sa.UniqueConstraint("user_id", "date"),
)

daily_stats = sa.Table(
    "daily_stats",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("date", sa.Date, nullable=False),
    sa.Column("energy", sa.Integer, nullable=False, default=0),
    sa.Column("focus", sa.Integer, nullable=False, default=0),
    sa.Column("mood", sa.Integer, nullable=False, default=0),
    sa.Column("creative", sa.Integer, nullable=False, default=0),
    sa.UniqueConstraint("user_id", "date"),
)

# ─── Plans ──────────────────────────────────────────

plans = sa.Table(
    "plans",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("title", sa.String, nullable=False),
    sa.Column("summary", sa.Text, nullable=False),
    sa.Column("steps_json", sa.Text, nullable=False),
    sa.Column("source_message", sa.Text, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── Habits ─────────────────────────────────────────

habits = sa.Table(
    "habits",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("name", sa.String, nullable=False),
    sa.Column("frequency", sa.String, nullable=False, default="daily"),
    sa.Column("active", sa.Boolean, nullable=False, default=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

habit_logs = sa.Table(
    "habit_logs",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("habit_id", sa.String, sa.ForeignKey("habits.id")),
    sa.Column("date", sa.Date, nullable=False),
    sa.UniqueConstraint("habit_id", "date"),
)

# ─── Skill Tree ─────────────────────────────────────

skill_nodes = sa.Table(
    "skill_nodes",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("name", sa.String, nullable=False),
    sa.Column("category", sa.String, nullable=True),
    sa.Column("description", sa.Text),
    sa.Column("xp", sa.Integer, default=0),
    sa.Column("level", sa.Integer, default=1),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

skill_edges = sa.Table(
    "skill_edges",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("source_id", sa.String, sa.ForeignKey("skill_nodes.id")),
    sa.Column("target_id", sa.String, sa.ForeignKey("skill_nodes.id")),
    sa.Column("strength", sa.Float, default=0.5),
    sa.Column("reason", sa.String, nullable=True),
)

skill_badges = sa.Table(
    "skill_badges",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("skill_node_id", sa.String, sa.ForeignKey("skill_nodes.id")),
    sa.Column("name", sa.String),
    sa.Column("description", sa.String),
    sa.Column("earned_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── Mind Graph ─────────────────────────────────────

mind_nodes = sa.Table(
    "mind_nodes",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("text", sa.Text, nullable=False),
    sa.Column("category", sa.String, nullable=True),
    sa.Column("color", sa.String, nullable=True),
    sa.Column("source", sa.String, default="manual"),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

node_connections = sa.Table(
    "node_connections",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("source_id", sa.String, sa.ForeignKey("mind_nodes.id")),
    sa.Column("target_id", sa.String, sa.ForeignKey("mind_nodes.id")),
    sa.Column("strength", sa.Float, default=0.5),
    sa.Column("reason", sa.Text, nullable=True),
    sa.Column("kind", sa.String, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# ─── Project Garage ─────────────────────────────────

projects = sa.Table(
    "projects",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("title", sa.String, nullable=False),
    sa.Column("description", sa.Text),
    sa.Column("status", sa.String, default="idea"),
    sa.Column("priority", sa.Integer, default=3),
    sa.Column("plan_ids_json", sa.Text, default="[]"),
    sa.Column("reference_ids_json", sa.Text, default="[]"),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
)

project_notes = sa.Table(
    "project_notes",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("user_id", sa.String, sa.ForeignKey("users.id"), nullable=False),
    sa.Column("project_id", sa.String, sa.ForeignKey("projects.id")),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("note_type", sa.String, default="thought"),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
