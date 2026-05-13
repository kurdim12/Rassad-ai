"""Application settings loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    tavily_api_key: str = Field(default="", alias="TAVILY_API_KEY")
    serper_api_key: str = Field(default="", alias="SERPER_API_KEY")

    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        alias="ALLOWED_ORIGINS",
    )
    cache_ttl: int = Field(default=3600, alias="CACHE_TTL")

    @property
    def origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def demo_mode(self) -> bool:
        """True when no live AI key is configured."""
        return not self.gemini_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
