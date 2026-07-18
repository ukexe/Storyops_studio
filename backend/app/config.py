from __future__ import annotations

from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # IBM watsonx.ai
    WATSONX_API_KEY: str
    WATSONX_PROJECT_ID: str
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Database (Supabase session pooler for the persistent API service)
    DATABASE_URL: str

    # Runtime hardening
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    ALLOW_ANONYMOUS_DEMO_SEED: bool = False

    @field_validator("*")
    @classmethod
    def reject_blank_values(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("required setting cannot be blank")
        return value

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        supported_schemes = (
            "postgresql+asyncpg://",
            "sqlite+aiosqlite://",
        )
        if not value.startswith(supported_schemes):
            raise ValueError(
                "DATABASE_URL must use postgresql+asyncpg or sqlite+aiosqlite"
            )
        return value

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",")]
        return [origin for origin in origins if origin]


settings = Settings()
