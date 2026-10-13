from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    google_client_id: str
    google_client_secret: str
    google_redirect_url: str = "http://localhost:5173/api/auth/google/callback"
    frontend_url: str = "http://localhost:5173"
    session_secret: str


settings = Settings()
