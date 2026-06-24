from __future__ import annotations
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./muse.db"

    # Per-purpose model routing — change individual models without touching code
    chat_model: str = "gpt-4o-mini"
    discovery_model: str = "gpt-4o-mini"
    edge_reason_model: str = "gpt-4o-mini"
    plan_model: str = "gpt-4o-mini"
    dna_model: str = "gpt-4o-mini"
    vision_model: str = "gpt-4o-mini"
    image_model: str = "dall-e-3"

    # Daily OpenAI spend cap in USD across all users (0 = no cap)
    openai_daily_budget_usd: float = 5.0

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
