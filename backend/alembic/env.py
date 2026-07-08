from __future__ import annotations
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Pull metadata and DB URL from the app
from app.db.database import metadata
from app.config import settings

target_metadata = metadata


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    from app.db.database import _asyncpg_engine_args
    db_url, connect_args = _asyncpg_engine_args(settings.database_url)
    connectable = create_async_engine(db_url, echo=False, connect_args=connect_args)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    raise RuntimeError("Offline mode not supported — run with a live DB connection.")
else:
    asyncio.run(run_migrations_online())
