from __future__ import annotations
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

metadata = sa.MetaData()

conversations = sa.Table(
    "conversations",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("title", sa.String, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

messages = sa.Table(
    "messages",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("conversation_id", sa.String, sa.ForeignKey("conversations.id")),
    sa.Column("role", sa.String, nullable=False),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

references = sa.Table(
    "references",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("type", sa.String, nullable=False),
    sa.Column("title", sa.String, nullable=False),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("file_path", sa.String, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

activity_log = sa.Table(
    "activity_log",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("date", sa.Date, unique=True, nullable=False),
)

daily_stats = sa.Table(
    "daily_stats",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("date", sa.Date, unique=True, nullable=False),
    sa.Column("energy", sa.Integer, nullable=False, default=0),
    sa.Column("focus", sa.Integer, nullable=False, default=0),
    sa.Column("mood", sa.Integer, nullable=False, default=0),
    sa.Column("creative", sa.Integer, nullable=False, default=0),
)

plans = sa.Table(
    "plans",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("title", sa.String, nullable=False),
    sa.Column("summary", sa.Text, nullable=False),
    sa.Column("steps_json", sa.Text, nullable=False),
    sa.Column("source_message", sa.Text, nullable=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

habits = sa.Table(
    "habits",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
    sa.Column("name", sa.String, nullable=False),
    sa.Column("frequency", sa.String, nullable=False, default="daily"),
    sa.Column("active", sa.Boolean, nullable=False, default=True),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

habit_logs = sa.Table(
    "habit_logs",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("habit_id", sa.String, sa.ForeignKey("habits.id")),
    sa.Column("date", sa.Date, nullable=False),
    sa.UniqueConstraint("habit_id", "date"),
)

# ─── Skill Tree ─────────────────────────────────────

skill_nodes = sa.Table(
    "skill_nodes",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
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
    sa.Column("source_id", sa.String, sa.ForeignKey("skill_nodes.id")),
    sa.Column("target_id", sa.String, sa.ForeignKey("skill_nodes.id")),
    sa.Column("strength", sa.Float, default=0.5),
    sa.Column("reason", sa.String, nullable=True),
)

skill_badges = sa.Table(
    "skill_badges",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
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
    sa.Column("text", sa.Text, nullable=False),  # max 280 chars logic enforced in pydantic
    sa.Column("category", sa.String, nullable=True), # idea | project | learning | question
    sa.Column("color", sa.String, nullable=True),
    sa.Column("source", sa.String, default="manual"), # manual | link-game | dna-import
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

node_connections = sa.Table(
    "node_connections",
    metadata,
    sa.Column("id", sa.String, primary_key=True),
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
    sa.Column("project_id", sa.String, sa.ForeignKey("projects.id")),
    sa.Column("content", sa.Text, nullable=False),
    sa.Column("note_type", sa.String, default="thought"),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


async def run_migrations():
    """Idempotent ALTER TABLE statements for columns added after initial schema creation."""
    new_columns = [
        ("reason", "TEXT"),
        ("kind", "TEXT"),
        ("created_at", "DATETIME"),
    ]
    async with engine.begin() as conn:
        result = await conn.execute(sa.text("PRAGMA table_info(node_connections)"))
        existing = {row[1] for row in result.fetchall()}
        for col_name, col_type in new_columns:
            if col_name not in existing:
                await conn.execute(
                    sa.text(f"ALTER TABLE node_connections ADD COLUMN {col_name} {col_type}")
                )


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
