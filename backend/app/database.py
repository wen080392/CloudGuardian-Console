
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import redis.asyncio as redis
from app.core.config import settings

# Database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
    pool_recycle=3600
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Dependency for database sessions
def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Ensures session is closed after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency for Redis
async def get_redis() -> redis.Redis:
    return redis_client
