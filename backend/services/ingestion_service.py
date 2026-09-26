import hashlib
import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.core.config import settings, UPLOAD_DIR
from backend.models.document import Document, DocumentSection, Chunk
from backend.models.audit import AuditLog
from backend.pipelines.dom_builder import DOMBuilder
from backend.retrieval.chunker import SemanticChunker
from backend.retrieval.embedder import Embedder
from backend.services.websocket_manager import ws_manager

class IngestionService:
    """
    Ingestion Service & Pipeline Orchestrator (PRD §5.1, §5.2 & §7.2).
    Orchestrates file upload, deduplication, routing, DOM building,
    semantic chunking, vector embedding, and live status broadcasting.
    """

    @classmethod
    def compute_sha256(cls, file_path: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @classmethod
    async def process_document_pipeline(
        cls, 
        document_id: str, 
        db_factory
    ):
        """
        Executes end-to-end processing DAG:
        Classifying -> Extracting -> Embedding -> Indexed / Failed.
        Broadcasts status updates over WebSocket.
        """
        db: Session = db_factory()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            db.close()
            return

        try:
            # 1. Classifying Stage
            doc.status = "classifying"
            db.commit()
            await ws_manager.broadcast_status(
                document_id, "classifying", 25, "Classifying document layout and structure"
            )

            # 2. Extracting Stage (DOM Generation)
            doc.status = "extracting"
            db.commit()
            await ws_manager.broadcast_status(
                document_id, "extracting", 50, "Extracting text, layout, and structured tables"
            )

            dom = DOMBuilder.build_dom(document_id=doc.id, file_path=doc.storage_path)
            doc.doc_type = dom.get("doc_type", "native_pdf")
            doc.page_count = dom.get("metadata", {}).get("total_pages", len(dom.get("pages", [])))
            doc.doc_metadata = dom.get("metadata", {})
            db.commit()

            # Store document sections
            section_objects = []
            for page in dom.get("pages", []):
                p_num = page.get("page_number", 1)
                for sec in page.get("sections", []):
                    section_row = DocumentSection(
                        document_id=doc.id,
                        page_number=p_num,
                        section_title=sec.get("section_title"),
                        section_order=sec.get("section_order", 0),
                        bbox=sec.get("bbox"),
                        content_type=sec.get("type", "text"),
                        raw_content=sec.get("text") or sec.get("caption") or "",
                        structured_data=sec.get("data"),
                        ocr_confidence=sec.get("ocr_confidence"),
                        caption=sec.get("caption")
                    )
                    db.add(section_row)
                    section_objects.append(section_row)
            db.commit()

            # 3. Chunking & Embedding Stage
            doc.status = "embedding"
            db.commit()
            await ws_manager.broadcast_status(
                document_id, "embedding", 75, "Generating semantic chunks and vector embeddings"
            )

            chunks = SemanticChunker.chunk_dom(dom)
            for chunk_data in chunks:
                emb = Embedder.get_embedding(chunk_data["chunk_text"])
                chunk_row = Chunk(
                    document_id=doc.id,
                    chunk_text=chunk_data["chunk_text"],
                    chunk_order=chunk_data["chunk_order"],
                    page_number=chunk_data["page_number"],
                    char_start=chunk_data["char_start"],
                    char_end=chunk_data["char_end"],
                    bbox=chunk_data.get("bbox"),
                    ocr_confidence=chunk_data.get("ocr_confidence"),
                    embedding=emb,
                    tsv_tokens=chunk_data["chunk_text"].lower()
                )
                db.add(chunk_row)
            db.commit()

            # 4. Indexed Stage (Complete)
            doc.status = "indexed"
            db.commit()
            await ws_manager.broadcast_status(
                document_id, "indexed", 100, f"Indexing complete! Ready for search with {len(chunks)} chunks."
            )

        except Exception as e:
            db.rollback()
            doc.status = "failed"
            doc.error_reason = str(e)
            db.commit()
            await ws_manager.broadcast_status(
                document_id, "failed", 0, "Processing failed", error_reason=str(e)
            )
        finally:
            db.close()
