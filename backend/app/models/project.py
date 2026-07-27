
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, JSON, Text
from sqlalchemy.orm import relationship
import enum
from app.database import Base
from .base import TimestampMixin

class CloudProvider(str, enum.Enum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"

class Project(Base, TimestampMixin):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cloud_provider = Column(Enum(CloudProvider), default=CloudProvider.AWS)
    region = Column(String(100), default="us-east-1")
    
    # Metadata
    tags = Column(JSON, default=list)
    
    # Relationships (User relationship needs to be defined in User model too or via backref)
    # owner = relationship("User", back_populates="projects")
