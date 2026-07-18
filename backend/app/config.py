from __future__ import annotations

from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # IBM watsonx.ai
    WATSONX_API_KEY: str
    WATSONX_PROJECT_ID: str
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_PUBLISHABLE_KEY: str
    SUPABASE_SECRET_KEY: str
    SUPABASE_JWKS_URL: str

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

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.ENVIRONMENT != "production":
            return self
        for name in ("SUPABASE_URL", "SUPABASE_JWKS_URL", "WATSONX_URL"):
            if not getattr(self, name).startswith("https://"):
                raise ValueError(f"{name} must use HTTPS in production")
        if any(not origin.startswith("https://") for origin in self.cors_origins):
            raise ValueError("CORS_ORIGINS must use HTTPS in production")
        if ":6543/" in self.DATABASE_URL:
            raise ValueError("Production API must use the session pooler on port 5432")
        return self


settings = Settings()
