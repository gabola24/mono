from __future__ import annotations
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./muse.db"
    openai_model: str = "gpt-4.1"
    openai_reasoning_model: str = "gpt-4.1-mini"

    model_config = {"env_file": ".env"}


settings = Settings()
