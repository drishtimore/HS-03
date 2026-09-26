from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.document import Document, DocumentSection, Chunk
from backend.models.conversation import Conversation, Message
from backend.models.audit import AuditLog
from backend.core.database import get_database_stats

class AdminService:
    """
    Admin & Observability Service (PRD §5.8 FR-38 & §15).
    Exposes pipeline health, latency, queue depth, audit trails, and live database explorer.
    """

    @classmethod
    def get_pipeline_health(cls, db: Session) -> Dict[str, Any]:
        """Returns real-time pipeline status, queue depth, and health metrics."""
        total_docs = db.query(Document).count()
        status_counts = dict(
            db.query(Document.status, func.count(Document.id)).group_by(Document.status).all()
        )
        
        doc_type_counts = dict(
            db.query(Document.doc_type, func.count(Document.id)).group_by(Document.doc_type).all()
        )

        total_sections = db.query(DocumentSection).count()
        total_chunks = db.query(Chunk).count()
        total_messages = db.query(Message).count()

        # Low confidence OCR count (< 0.60)
        low_ocr_count = db.query(DocumentSection).filter(
            DocumentSection.ocr_confidence.isnot(None),
            DocumentSection.ocr_confidence < 0.60
        ).count()

        queued_count = status_counts.get("queued", 0)
        processing_count = (
            status_counts.get("classifying", 0) + 
            status_counts.get("extracting", 0) + 
            status_counts.get("embedding", 0)
        )
        failed_count = status_counts.get("failed", 0)
        indexed_count = status_counts.get("indexed", 0)

        failure_rate = round((failed_count / max(1, total_docs)) * 100, 2)

        return {
            "total_documents": total_docs,
            "queue_depth": queued_count,
            "currently_processing": processing_count,
            "indexed_documents": indexed_count,
            "failed_documents": failed_count,
            "failure_rate_percentage": failure_rate,
            "status_distribution": status_counts,
            "type_distribution": doc_type_counts,
            "total_sections_extracted": total_sections,
            "total_chunks_indexed": total_chunks,
            "total_queries_served": total_messages,
            "low_ocr_confidence_sections": low_ocr_count,
            "health_status": "healthy" if failure_rate < 15.0 else "degraded"
        }

    @classmethod
    def get_db_explorer_data(cls) -> Dict[str, Any]:
        """Returns live database tables and sample rows for the presentation."""
        return get_database_stats()

    @classmethod
    def get_audit_trail(
        cls, 
        db: Session, 
        action: Optional[str] = None, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Returns compliance audit logs."""
        query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
        if action:
            query = query.filter(AuditLog.action == action)
        logs = query.limit(limit).all()

        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "target_id": log.target_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
