from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    postgres_user: str = "chatup"
    postgres_password: str = "chatup"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "chatup"

    postgres_pool_min_size: int = 1
    postgres_pool_max_size: int = 8
    postgres_pool_open: bool = True

    openai_api_key: str = ""
    chat_model: str = "gpt-4o-mini"
    memory_model: str = "gpt-4o-mini"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def postgres_row_factory(self):
        from psycopg.rows import dict_row

        return dict_row


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.openai_api_key:
        os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
    return settings

