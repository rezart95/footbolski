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

    # Twilio — WhatsApp via Twilio's Business Solution Provider layer over the
    # same underlying WABA. `twilio_whatsapp_from` is a bare E.164 number (no
    # "whatsapp:" prefix — the gateway adds it); WhatsApp is the primary
    # channel, SMS is not implemented here.
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
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
    # Every rung but the last (soonest before kickoff) goes to core players
    # only; the last one widens to everyone. Currently a single rung — the
    # 5-day core-only rung is disabled, not removed: add "5," back
    # (e.g. "5,3") to restore it, no code change needed.
    invite_ladder_days: str = "3"

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

    # Feature switch, not a deletion: the ballot and winner-announcement jobs
    # (scheduled_jobs.run_motm_ballots / run_motm_results) both check this and
    # no-op when False, so no MOTM message goes out after a match ends while
    # the feature itself stays fully implemented. Flip back to True to resume.
    motm_messages_enabled: bool = False

    # Shared secret guarding /api/v1/admin/* and the scheduler tick. There is no
    # user authentication in this app, so these routes are protected by this
    # value alone. Unset means the routes refuse every request rather than
    # falling open.
    internal_api_secret: str | None = None

    # extra="ignore": .env can carry values nothing here reads (e.g. the old
    # META_* credentials, kept around on request rather than deleted) without
    # crashing startup — pydantic-settings otherwise rejects any env var that
    # isn't a declared field.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
