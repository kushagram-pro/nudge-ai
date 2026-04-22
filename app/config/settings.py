import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "NudgeAI")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./nudgeai.db")
    seed_demo_data: bool = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
    demo_tenant_name: str = os.getenv("DEMO_TENANT_NAME", "Acme Fitness")
    demo_api_key: str = os.getenv("DEMO_API_KEY", "nudge_demo_api_key_123")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")


settings = Settings()
