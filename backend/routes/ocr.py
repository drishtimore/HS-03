import os
import io
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from PIL import Image

from backend.core.database import get_db, SessionLocal
from backend.core.config import UPLOAD_DIR
from backend.core.security import get_current_user_optional
from backend.pipelines.ocr_engine import OCREnginePipeline
from backend.models.document import Document
from backend.models.audit import AuditLog
from backend.services.ingestion_service import IngestionService

router = APIRouter(prefix="/ocr", tags=["ocr"])

ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"}

@router.post("/image-to-text")
async def extract_image_to_text(
    file: UploadFile = File(...),
    save_to_workspace_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Direct Image-to-Text OCR Extraction workbench endpoint.
    Performs preprocessing, deskewing, deep-learning RapidOCR/Tesseract detection,
    and returns full text, token confidences, and bounding box coordinates.
    Optionally saves the extracted document into the selected workspace library.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_IMAGE_EXTS))}"
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty."
        )

    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        width, height = pil_img.size
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}"
        )

    # Run extraction pipeline
    extraction = OCREnginePipeline.extract_from_image(file_bytes, page_number=1)
    
    extracted_text = extraction.get("text", "")
    sections = extraction.get("sections", [])
    confidence = extraction.get("ocr_confidence", 0.90)

    words = [w for w in extracted_text.split() if w.strip()]
    lines = [l for l in extracted_text.split("\n") if l.strip()]

    result = {
        "filename": file.filename,
        "width": width,
        "height": height,
        "confidence": confidence,
        "confidence_percentage": f"{round(confidence * 100, 1)}%",
        "text": extracted_text,
        "lines_count": len(lines),
        "words_count": len(words),
        "engine": "rapidocr-onnx",
        "sections": sections,
        "saved_document_id": None
    }

    # Optionally persist directly into the user's workspace
    if save_to_workspace_id and save_to_workspace_id != "undefined":
        temp_filename = f"{uuid.uuid4()}_{file.filename}"
        saved_path = UPLOAD_DIR / temp_filename
        with open(saved_path, "wb") as f_out:
            f_out.write(file_bytes)

        content_hash = IngestionService.compute_sha256(str(saved_path))
        file_size = len(file_bytes)
        user_id = current_user.get("sub") if current_user else None

        # Check deduplication
        existing = db.query(Document).filter(
            Document.workspace_id == save_to_workspace_id,
            (Document.content_hash == content_hash) | (Document.filename == file.filename)
        ).first()

        if not existing:
            doc = Document(
                workspace_id=save_to_workspace_id,
                filename=file.filename,
                content_hash=content_hash,
                storage_path=str(saved_path),
                status="indexed",
                doc_type="image_scan",
                page_count=1,
                file_size_bytes=file_size,
                uploaded_by=user_id,
                doc_metadata={
                    "ocr_engine": "rapidocr-onnx",
                    "avg_confidence": confidence,
                    "words_count": len(words),
                    "lines_count": len(lines)
                }
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            result["saved_document_id"] = doc.id
        else:
            result["saved_document_id"] = existing.id

    return result
