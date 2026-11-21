from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    postgres_user: str = "chatup"
    postgres_password: str = "chatup"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "chatup"

    openai_api_key: str = ""
    chat_model: str = "gpt-4o-mini"
    memory_model: str = "gpt-4o-mini"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

