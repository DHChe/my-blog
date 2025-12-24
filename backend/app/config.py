from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/blog_db"

    # Admin API Key (temporary authentication)
    ADMIN_API_KEY: str = "dev-api-key"

    # Application
    DEBUG: bool = False


settings = Settings()
