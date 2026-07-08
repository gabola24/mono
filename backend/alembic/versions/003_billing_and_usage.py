"""add usage_log and stripe_events tables

Revision ID: 003
Revises: 002
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usage_log",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("image_count", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("user_id", "date"),
    )

    op.create_table(
        "stripe_events",
        sa.Column("event_id", sa.String(), primary_key=True, nullable=False),
        sa.Column("processed_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("event_id"),
    )


def downgrade() -> None:
    op.drop_table("usage_log")
    op.drop_table("stripe_events")
