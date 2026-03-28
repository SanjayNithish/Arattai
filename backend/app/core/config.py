from functools import cached_property

from pydantic import field_validator

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Realtime Chat API"
    api_v1_prefix: str = "/api"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/chat_app"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: str = "uploads"
    public_asset_base_url: str | None = None
    auto_init_db: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator(
        "app_name",
        "api_v1_prefix",
        "secret_key",
        "database_url",
        "allowed_origins",
        "upload_dir",
        "public_asset_base_url",
        mode="before",
    )
    @classmethod
    def strip_string_values(cls, value: str | None):
        if isinstance(value, str):
            return value.strip()
        return value

    @cached_property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
