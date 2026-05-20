from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://nexasupply:nexasupply123@localhost:5432/nexasupply"
    JWT_SECRET: str = "demo-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    ADMIN_EMAIL: str = "admin@nexasupply.store"
    ADMIN_PASSWORD: str = "admin123"
    APP_ENV: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
