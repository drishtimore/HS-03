import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.core.database import Base

class AuditLog(Base):
    """
    Compliance audit trail logging every document ingestion, query, and administrative action (PRD §8.1).
    """
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # upload, query, view_document, delete_document, export
    target_id = Column(String(36), nullable=True, index=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
