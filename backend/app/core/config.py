from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "pitchup-media"
    minio_public_url: str = "http://localhost:9000"
    cors_origins: str = "http://localhost:5174"
    environment: str = "development"
    claude_api_key: str | None = None
    claude_model: str = "claude-sonnet-4-6"

    # Public URL used inside reminder messages
    app_public_url: str = "http://localhost:5174"

    # Web Push (VAPID) — generate with `vapid --gen` or `pywebpush`'s helper
    vapid_public_key: str | None = None
    vapid_private_key: str | None = None
    vapid_subject: str = "mailto:admin@example.com"

    # Twilio SMS
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None

    # Reminder policy
    default_phone_region: str = "PL"
    sms_max_per_event: int = 2
    reminder_cooldown_minutes: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
