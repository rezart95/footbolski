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

    # Twilio. `twilio_from_number` is the SMS sender; `twilio_whatsapp_from` is
    # the WhatsApp sender and must include the channel prefix, e.g.
    # "whatsapp:+14472474922". WhatsApp is the primary channel: SMS to Poland
    # costs roughly ten times as much and doubles again for any message
    # containing Cyrillic or Albanian characters.
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None
    twilio_whatsapp_from: str | None = None

    # The exact public URL Twilio is configured to call. Signature validation
    # hashes the URL, and behind Cloudflare plus Coolify the URL FastAPI sees is
    # not the one Twilio signed, so it must be stated rather than inferred.
    twilio_webhook_url: str | None = None

    # Reject unsigned webhook calls. Leave true in production. Turning it off
    # makes the endpoint world-writable, so it exists only for local testing.
    twilio_validate_signature: bool = True

    # Reminder policy
    default_phone_region: str = "PL"
    reminder_cooldown_minutes: int = 10

    # Maximum proactive messages per player per event. State changes the player
    # did not ask for, such as being promoted off the waiting list, are exempt.
    max_messages_per_event: int = 3

    # Invite ladder: days before kickoff at which each rung fires, widest last.
    # Rung 0 goes to core players only; later rungs widen to everyone.
    invite_ladder_days: str = "5,3"

    # Nothing is sent outside these local hours. The upper bound is 22 so the
    # Man of the Match ballot at kickoff+100min (about 21:10) stays legal.
    quiet_hours_start: int = 8
    quiet_hours_end: int = 22

    # Payment reminder fires this many days before kickoff.
    payment_reminder_days_before: int = 1

    # Man of the Match: ballot opens this long after kickoff and stays open
    # for this many hours, or until every confirmed player has voted.
    motm_open_after_minutes: int = 100
    motm_window_hours: int = 24

    # Shared secret guarding /api/v1/admin/* and the scheduler tick. There is no
    # user authentication in this app, so these routes are protected by this
    # value alone. Unset means the routes refuse every request rather than
    # falling open.
    internal_api_secret: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
