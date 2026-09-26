import asyncio
import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from backend.core.database import get_db, SessionLocal
from backend.core.config import UPLOAD_DIR
from backend.core.security import get_current_user_optional
from backend.models.document import Document, DocumentSection, DocumentResponse, DocumentStatusResponse
from backend.models.audit import AuditLog
from backend.services.ingestion_service import IngestionService

router = APIRouter(tags=["documents"])

@router.post("/workspaces/{workspace_id}/documents", status_code=status.HTTP_202_ACCEPTED)
async def upload_documents(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Accepts single or batch uploads (PDF, Scans, Images, Tables, Office docs) (PRD §5.1 FR-1 to FR-5).
    Performs SHA-256 deduplication and launches async processing pipeline.
    """
    uploaded_records = []
    user_id = current_user.get("sub") if current_user else None

    for file in files:
        # Save file to upload directory
        file_ext = os.path.splitext(file.filename)[1]
        temp_filename = f"{uuid.uuid4()}_{file.filename}"
        saved_path = UPLOAD_DIR / temp_filename

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Compute SHA-256 content hash for deduplication (FR-5)
        content_hash = IngestionService.compute_sha256(str(saved_path))
        file_size = os.path.getsize(saved_path)

        # Check deduplication within workspace
        existing = db.query(Document).filter(
            Document.workspace_id == workspace_id,
            Document.content_hash == content_hash
        ).first()

        if existing:
            # Clean up duplicate file
            try:
                os.remove(saved_path)
            except Exception:
                pass
            uploaded_records.append({
                "document_id": existing.id,
                "filename": existing.filename,
                "status": existing.status,
                "is_duplicate": True,
                "message": "Identical document already indexed in workspace (Deduplicated)"
            })
            continue

        # Create new document record
        doc = Document(
            workspace_id=workspace_id,
            filename=file.filename,
            content_hash=content_hash,
            storage_path=str(saved_path),
            status="queued",
            file_size_bytes=file_size,
            uploaded_by=user_id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="upload_document",
            target_id=doc.id,
            details={"filename": file.filename, "size_bytes": file_size, "hash": content_hash}
        )
        db.add(audit)
        db.commit()

        # Enqueue background pipeline execution
        background_tasks.add_task(
            IngestionService.process_document_pipeline,
            doc.id,
            SessionLocal
        )

        uploaded_records.append({
            "document_id": doc.id,
            "filename": doc.filename,
            "status": "queued",
            "is_duplicate": False,
            "message": "Document queued for processing"
        })

    return {
        "workspace_id": workspace_id,
        "total_files": len(files),
        "results": uploaded_records
    }

@router.get("/workspaces/{workspace_id}/documents", response_model=List[DocumentResponse])
def list_workspace_documents(
    workspace_id: str,
    doc_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists documents with type and status filtering (PRD §5.4 FR-20)."""
    query = db.query(Document).filter(Document.workspace_id == workspace_id)
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    if status_filter:
        query = query.filter(Document.status == status_filter)
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))

    docs = query.order_by(Document.created_at.desc()).all()
    return docs

@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(document_id: str, db: Session = Depends(get_db)):
    """Poll processing status (PRD §9)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    progress_map = {
        "queued": 10,
        "classifying": 25,
        "extracting": 50,
        "embedding": 75,
        "indexed": 100,
        "failed": 0
    }

    stage_map = {
        "queued": "Document queued for ingestion",
        "classifying": "Analyzing layout & format routing",
        "extracting": "Extracting text, sections, and structured tables",
        "embedding": "Generating semantic chunks & vector embeddings",
        "indexed": "Document successfully indexed and ready for search",
        "failed": f"Processing failed: {doc.error_reason or 'Internal error'}"
    }

    return DocumentStatusResponse(
        id=doc.id,
        status=doc.status,
        progress_percentage=progress_map.get(doc.status, 0),
        stage_message=stage_map.get(doc.status, "Processing"),
        error_reason=doc.error_reason
    )

@router.get("/documents/{document_id}")
def get_document_details(document_id: str, db: Session = Depends(get_db)):
    """Fetches document metadata and Unified DOM structure (PRD §8.2 & §9)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    sections = db.query(DocumentSection).filter(
        DocumentSection.document_id == document_id
    ).order_by(DocumentSection.page_number, DocumentSection.section_order).all()

    # Organize sections by page
    pages_map = {}
    for s in sections:
        p_num = s.page_number
        if p_num not in pages_map:
            pages_map[p_num] = []
        pages_map[p_num].append({
            "id": s.id,
            "type": s.content_type,
            "section_title": s.section_title,
            "section_order": s.section_order,
            "text": s.raw_content,
            "data": s.structured_data,
            "caption": s.caption,
            "bbox": s.bbox,
            "ocr_confidence": s.ocr_confidence,
            "low_confidence_flag": s.ocr_confidence is not None and s.ocr_confidence < 0.60
        })

    pages = [{"page_number": p, "sections": sec_list} for p, sec_list in sorted(pages_map.items())]

    return {
        "document_id": doc.id,
        "workspace_id": doc.workspace_id,
        "filename": doc.filename,
        "content_hash": doc.content_hash,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "page_count": doc.page_count,
        "error_reason": doc.error_reason,
        "pages": pages,
        "metadata": doc.doc_metadata or {},
        "created_at": doc.created_at
    }

@router.get("/documents/{document_id}/page/{page_number}")
def get_page_details(document_id: str, page_number: int, db: Session = Depends(get_db)):
    """
    Returns section bounding boxes and OCR confidence overlay for the split-screen Document Viewer (PRD §5.6 & §10.2).
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    sections = db.query(DocumentSection).filter(
        DocumentSection.document_id == document_id,
        DocumentSection.page_number == page_number
    ).order_by(DocumentSection.section_order).all()

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "page_number": page_number,
        "total_pages": doc.page_count,
        "sections": [
            {
                "id": s.id,
                "type": s.content_type,
                "section_title": s.section_title,
                "bbox": s.bbox,
                "ocr_confidence": s.ocr_confidence,
                "text": s.raw_content,
                "data": s.structured_data
            }
            for s in sections
        ]
    }

@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """Deletes document and cascades sections & chunks."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Clean local file
    try:
        if os.path.exists(doc.storage_path):
            os.remove(doc.storage_path)
    except Exception:
        pass

    db.delete(doc)
    db.commit()

    audit = AuditLog(
        user_id=current_user.get("sub") if current_user else None,
        action="delete_document",
        target_id=document_id,
        details={"filename": doc.filename}
    )
    db.add(audit)
    db.commit()

    return {"status": "ok", "message": f"Document '{doc.filename}' deleted successfully"}
