
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from app.database import Base

class TimestampMixin:
    """Mixin para adicionar timestamps a todos os modelos"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
