import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from backend.core.database import Base
from backend.models.user import User, Workspace

# ==========================================
# SQLAlchemy Relational Models (PRD §8.1)
# ==========================================

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for dedup (FR-5)
    storage_path = Column(String(500), nullable=False)
    doc_type = Column(String(50), nullable=True)  # native_pdf, scanned_pdf, image, table_doc, office_doc
    status = Column(String(50), default="queued", index=True)  # queued, classifying, extracting, embedding, indexed, failed
    page_count = Column(Integer, default=1)
    language = Column(String(20), default="en")
    file_size_bytes = Column(Integer, default=0)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    error_reason = Column(Text, nullable=True)
    doc_metadata = Column(JSON, default=dict)  # Stores metadata (author, title, creation date)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="documents")
    uploader = relationship("User", back_populates="documents")
    sections = relationship("DocumentSection", back_populates="document", cascade="all, delete-orphan", order_by="DocumentSection.section_order")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan", order_by="Chunk.chunk_order")


class DocumentSection(Base):
    """
    Extracted structure matching the Unified Document Object Model (DOM) schema (PRD §8.2).
    """
    __tablename__ = "document_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, default=1)
    section_title = Column(String(255), nullable=True)
    section_order = Column(Integer, default=0)
    bbox = Column(JSON, nullable=True)  # [x0, y0, x1, y1] for citation highlights (FR-29)
    content_type = Column(String(50), default="text")  # text, table, image, heading
    raw_content = Column(Text, nullable=False)  # Text or structured table JSON/Markdown
    structured_data = Column(JSON, nullable=True)  # 2D table matrix or chart metadata
    ocr_confidence = Column(Float, nullable=True)  # None for native, float for OCR (FR-13)
    caption = Column(Text, nullable=True)  # Multimodal description for images
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="sections")
    chunks = relationship("Chunk", back_populates="section")


class Chunk(Base):
    """
    Semantic retrieval unit for Hybrid Search (Dense vector + BM25 keyword tokens).
    """
    __tablename__ = "chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(String(36), ForeignKey("document_sections.id", ondelete="SET NULL"), nullable=True)
    chunk_text = Column(Text, nullable=False)
    chunk_order = Column(Integer, default=0)
    page_number = Column(Integer, default=1)
    char_start = Column(Integer, default=0)
    char_end = Column(Integer, default=0)
    bbox = Column(JSON, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    
    # Embedding stored as JSON serialized float list for universal compatibility
    embedding = Column(JSON, nullable=True)
    
    # Tokenized representation for BM25 and keyword search
    tsv_tokens = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="chunks")
    section = relationship("DocumentSection", back_populates="chunks")


# ==========================================
# Pydantic Schemas
# ==========================================

class SectionDOM(BaseModel):
    id: Optional[str] = None
    type: str  # heading, text, table, image
    text: Optional[str] = None
    data: Optional[List[List[Any]]] = None
    caption: Optional[str] = None
    bbox: Optional[List[float]] = None
    ocr_confidence: Optional[float] = None

class PageDOM(BaseModel):
    page_number: int
    sections: List[SectionDOM]

class UnifiedDOM(BaseModel):
    document_id: str
    doc_type: str
    pages: List[PageDOM]
    metadata: Dict[str, Any]

class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    filename: str
    content_hash: str
    doc_type: Optional[str]
    status: str
    page_count: int
    language: str
    file_size_bytes: int
    error_reason: Optional[str] = None
    created_at: datetime
    doc_metadata: Optional[Dict[str, Any]] = None

class DocumentStatusResponse(BaseModel):
    id: str
    status: str
    progress_percentage: int
    stage_message: str
    error_reason: Optional[str] = None
