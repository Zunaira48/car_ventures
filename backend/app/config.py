from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str
    admin_email: str = ""
    gemini_api_key: str = ""
    # Google periodically retires free-tier model names (gemini-2.0-flash-lite was
    # shut down June 1, 2026) - if AI Search starts returning 503s with a 404 in the
    # logs, check https://ai.google.dev/gemini-api/docs/models for the current stable
    # flash-lite model name and override via the GEMINI_MODEL env var, no code change needed.
    gemini_model: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()