import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship

from backend.core.database import Base

# ==========================================
# SQLAlchemy Relational Models (PRD §8.1)
# ==========================================

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), default="New Research Session")
    active_document_ids = Column(JSON, default=list)  # Pinned subset of documents (FR-26)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    rewritten_query = Column(Text, nullable=True)  # Resolved query with history (FR-25)
    confidence_level = Column(String(20), default="high")  # 'high', 'medium', 'low', 'insufficient'
    citations = Column(JSON, default=list)  # Array of {document_id, document_name, page, section, snippet, score}
    conflicts_detected = Column(Boolean, default=False)  # PRD §5.7 & FR-33
    conflict_details = Column(JSON, nullable=True)  # Side-by-side snippet comparisons
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")


# ==========================================
# Pydantic Schemas
# ==========================================

class Citation(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    section_title: Optional[str] = "General Content"
    snippet: str
    score: float
    ocr_confidence: Optional[float] = None
    bbox: Optional[List[float]] = None

class ConflictDetail(BaseModel):
    topic: str
    claims: List[Dict[str, Any]]
    explanation: str

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    active_document_ids: Optional[List[str]] = None

class QueryResponse(BaseModel):
    answer: str
    confidence_level: str  # high, medium, low, insufficient
    citations: List[Citation]
    conflicts_detected: bool = False
    conflict_details: Optional[List[ConflictDetail]] = None
    rewritten_query: Optional[str] = None

class ConversationCreate(BaseModel):
    title: Optional[str] = "Document Intelligence Research"
    active_document_ids: Optional[List[str]] = None

class ConversationResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    active_document_ids: List[str]
    created_at: datetime
    message_count: Optional[int] = 0

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    rewritten_query: Optional[str] = None
    confidence_level: Optional[str] = None
    citations: Optional[List[Citation]] = []
    conflicts_detected: Optional[bool] = False
    conflict_details: Optional[Any] = None
    created_at: datetime
