from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://tomoe:your_secret_here@localhost:5432/tomoe_db"
    redis_url: str = "redis://localhost:6379"
    model_dir: str = "/app/models"
    indobert_model: str = "indolem/indobert-base-uncased"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
