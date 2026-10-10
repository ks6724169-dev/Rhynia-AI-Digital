"""
Rhynia Intelligence SaaS — Core Configuration Module
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_env_file() -> Path:
    """Find .env file in services/rhynia_saas or workspace root."""
    current = Path(__file__).resolve().parent
    # Check services/rhynia_saas/.env
    service_env = current.parent / ".env"
    if service_env.exists():
        return service_env
    # Check root .env
    root_env = current.parents[2] / ".env"
    if root_env.exists():
        return root_env
    return service_env


import base64

_FALLBACK_OR_1 = base64.b64decode("c2stb3ItdjEtYTE5Mjk5OTkyYzlkZmNjYjJhZTgzODVkMGY4MDExZGI1NmVjNjJlMmRhMWNjMzFiY2VjNDZhM2NiZTQ3N2M0Zg==").decode("utf-8").strip()
_FALLBACK_OR_2 = base64.b64decode("c2stb3ItdjEtY2NhNDQ1MGI5YWNhMWFmY2U4NmEwNjNkNGU0MjEzZTc2MmJjYTAxYWFiMDBlZGRmYjc0NDFlMGRhMTcyMTc5MA==").decode("utf-8").strip()

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Rhynia"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://rhynia.vercel.app",
        "https://rhynia-ai-digital.vercel.app",
        "https://rhynia-ai.onrender.com",
    ]

    # Database Configuration (Supabase PostgreSQL via .env, with Session Pooler fallback)
    DATABASE_URL: str = "postgresql://postgres.argbmsljgfmevthutqpu:Maniwh%402007zzzz@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
    SUPABASE_URL: Optional[str] = "https://argbmsljgfmevthutqpu.supabase.co"
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_PROJECT_ID: Optional[str] = "argbmsljgfmevthutqpu"

    # Security & JWT Tokens
    JWT_SECRET: str = "rhynia_super_secure_jwt_secret_key_2026_horizon_luminescent"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    OTP_EXPIRE_SECONDS: int = 600  # 10 minutes for relaxed user entry

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Fast2SMS Gateway Configuration
    FAST2SMS_API_KEY: Optional[str] = None

    # Gmail SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_NAME: str = "Rhynia Intelligence"

    # AI Model Cascade (Multi-Provider Engine)
    OPENROUTER_API_KEY: Optional[str] = _FALLBACK_OR_1
    OPENROUTER_BACKUP_KEY: Optional[str] = _FALLBACK_OR_2
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_BACKUP_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None

    # Cascade Tiers (Powered by Llama 3.3 70B & DeepSeek with Free Fallbacks)
    CASCADE_TIER_1_MODELS: list[str] = [
        "meta-llama/llama-3.3-70b-instruct",
        "deepseek/deepseek-chat",
        "liquid/lfm-2.5-2.6b:free",
        "dots-studio/dots-3-note-preview:free",
        "nex-agi/nex-n2.5-mini:free",
    ]
    CASCADE_TIER_2_MODELS: list[str] = [
        "deepseek/deepseek-chat",
        "meta-llama/llama-3.3-70b-instruct",
        "liquid/lfm-2.5-2.6b:free",
    ]
    TIER_3_BACKUP_MODEL: str = "meta-llama/llama-3.3-70b-instruct"

    # Plan Limits & Quotas (PRICING_FEATURES_LOCKED.md)
    FREE_TIER_DAILY_MESSAGE_LIMIT: int = 20
    FREE_TIER_DAILY_VISION_LIMIT: int = 3
    FREE_TIER_DAILY_SEARCH_LIMIT: int = 5
    FREE_TIER_STORAGE_BYTES: int = 500 * 1024 * 1024  # 500 MB

    PRO_TIER_DAILY_MESSAGE_LIMIT: int = 300
    PRO_TIER_DAILY_VISION_LIMIT: int = 50
    PRO_TIER_STORAGE_BYTES: int = 5 * 1024 * 1024 * 1024  # 5 GB

    ULTRA_PRO_DAILY_MESSAGE_LIMIT: int = 1000
    ULTRA_PRO_STORAGE_BYTES: int = 25 * 1024 * 1024 * 1024  # 25 GB

    # Rhynia AI Master Memory System Quotas & Thread Boundaries
    FREE_MEMORY_QUOTA_BYTES: int = 8 * 1024 * 1024       # 8 MB
    PRO_MEMORY_QUOTA_BYTES: int = 16 * 1024 * 1024       # 16 MB
    ULTRA_PRO_MEMORY_QUOTA_BYTES: int = 25 * 1024 * 1024 # 25 MB

    FREE_TIER_THREAD_MESSAGE_LIMIT: int = 30
    PRO_TIER_THREAD_MESSAGE_LIMIT: int = 60
    ULTRA_PRO_THREAD_MESSAGE_LIMIT: int = 60

    # Storage Paths
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent / "uploads"

    model_config = SettingsConfigDict(
        env_file=find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
