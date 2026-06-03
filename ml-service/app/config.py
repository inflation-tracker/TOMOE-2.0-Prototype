from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://tomoe:your_secret_here@localhost:5432/tomoe_db"
    redis_url: str = "redis://localhost:6379"
    model_dir: str = "/app/models"
    # Fine-tuned Indonesian sentiment classifier (NOT a bare base LM — a base
    # model has an untrained classification head and yields meaningless labels).
    indobert_model: str = "mdhugol/indonesia-bert-sentiment-classification"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000", "http://frontend:3000"]

    # Optional shared-secret auth for the ML endpoints. When empty (default in
    # dev) auth is disabled; set API_KEY in any exposed environment to require
    # an X-API-Key header on the heavy POST endpoints.
    api_key: str = ""
    # Hard cap on user-supplied series/document lengths to bound CPU/RAM per
    # request (forecast trains a model synchronously — see main.py).
    max_series_length: int = 5000
    max_documents: int = 2000
    # Concurrency / timeout guards for the CPU-bound ML endpoints. Heavy work is
    # offloaded to a threadpool so the event loop stays responsive; jobs beyond
    # max_concurrent_jobs are load-shed (503) and jobs over the timeout 504.
    max_concurrent_jobs: int = 2
    job_timeout_seconds: float = 120.0
    # Pin model revisions so an upstream change can't silently alter outputs.
    sentiment_model_revision: str = "main"
    topic_embedding_model: str = "firqaaa/indo-sentence-bert-base"
    # BPS WebAPI key for the IHK scraper; empty means the scraper stays on mock.
    bps_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
