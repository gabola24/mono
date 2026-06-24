"""add user tenancy

Revision ID: 002
Revises: 001
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"

# All tables that need a user_id column
TABLES = [
    "conversations", "messages", "references",
    "activity_log", "daily_stats",
    "plans", "habits", "habit_logs",
    "skill_nodes", "skill_edges", "skill_badges",
    "mind_nodes", "node_connections",
    "projects", "project_notes",
]


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("clerk_user_id", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("subscription_tier", sa.String(), nullable=False, server_default="free"),
        sa.Column("stripe_customer_id", sa.String(), nullable=True),
        sa.Column("onboarded", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_user_id"),
    )

    # 2. Seed the system user (used as the single local user before Clerk is wired)
    op.execute(
        f"INSERT INTO users (id, subscription_tier, onboarded) "
        f"VALUES ('{SYSTEM_USER_ID}', 'pro', true)"
    )

    # 3. Add nullable user_id column + FK to every table
    for table in TABLES:
        op.add_column(table, sa.Column("user_id", sa.String(), nullable=True))
        op.create_foreign_key(
            f"fk_{table}_user_id", table, "users", ["user_id"], ["id"]
        )

    # 4. Backfill existing rows (empty DB in practice, but correct for safety)
    for table in TABLES:
        op.execute(f"UPDATE {table} SET user_id = '{SYSTEM_USER_ID}'")

    # 5. Make user_id NOT NULL now that every row has a value
    for table in TABLES:
        op.alter_column(table, "user_id", nullable=False)

    # 6. Indexes for fast per-user queries
    for table in TABLES:
        op.create_index(f"ix_{table}_user_id", table, ["user_id"])

    # 7. Fix unique constraints that were per-table but must now be per-user
    op.drop_constraint("activity_log_date_key", "activity_log", type_="unique")
    op.create_unique_constraint("uq_activity_log_user_date", "activity_log", ["user_id", "date"])

    op.drop_constraint("daily_stats_date_key", "daily_stats", type_="unique")
    op.create_unique_constraint("uq_daily_stats_user_date", "daily_stats", ["user_id", "date"])


def downgrade() -> None:
    op.drop_constraint("uq_daily_stats_user_date", "daily_stats", type_="unique")
    op.create_unique_constraint("daily_stats_date_key", "daily_stats", ["date"])

    op.drop_constraint("uq_activity_log_user_date", "activity_log", type_="unique")
    op.create_unique_constraint("activity_log_date_key", "activity_log", ["date"])

    for table in reversed(TABLES):
        op.drop_index(f"ix_{table}_user_id", table_name=table)
        op.drop_constraint(f"fk_{table}_user_id", table, type_="foreignkey")
        op.drop_column(table, "user_id")

    op.drop_table("users")
