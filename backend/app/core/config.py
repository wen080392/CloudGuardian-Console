
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
import secrets

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CloudGuardian"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = "temporary_secret_key_for_dev_mode"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000"
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://cloudguardian:cloudguardian123@postgres/cloudguardian"
    REDIS_URL: str = "redis://redis:6379"
    
    # External APIs
    GEMINI_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
