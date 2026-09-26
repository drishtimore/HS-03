import re
from typing import List, Dict, Any, Optional

class SemanticChunker:
    """
    Section-aware recursive semantic chunker (PRD §5.4 FR-17 & §7.2).
    - Preserves headings and section hierarchy
    - Keeps structured tables atomic (never splits mid-row)
    - Targets 512-800 characters (~150-250 words) with 15% overlap
    - Preserves page numbers, bounding boxes, and OCR confidence
    """

    DEFAULT_CHUNK_SIZE = 700  # characters
    DEFAULT_CHUNK_OVERLAP = 100  # characters (~15%)

    @classmethod
    def chunk_dom(cls, dom: Dict[str, Any]) -> List[Dict[str, Any]]:
        document_id = dom.get("document_id")
        pages = dom.get("pages", [])
        chunks: List[Dict[str, Any]] = []
        chunk_order = 0

        for page in pages:
            page_number = page.get("page_number", 1)
            sections = page.get("sections", [])

            for section in sections:
                sec_type = section.get("type", "text")
                sec_title = section.get("section_title", "General")
                sec_bbox = section.get("bbox")
                ocr_conf = section.get("ocr_confidence")
                
                # 1. Atomic Tables: Keep the whole table intact in a single chunk
                if sec_type == "table":
                    table_text = section.get("text", "")
                    if table_text.strip():
                        chunks.append({
                            "document_id": document_id,
                            "page_number": page_number,
                            "section_title": sec_title,
                            "chunk_order": chunk_order,
                            "chunk_text": f"### Table: {sec_title}\n{table_text}",
                            "char_start": 0,
                            "char_end": len(table_text),
                            "bbox": sec_bbox,
                            "ocr_confidence": ocr_conf,
                            "content_type": "table"
                        })
                        chunk_order += 1
                    continue

                # 2. Images with captions
                if sec_type == "image":
                    caption = section.get("caption", "")
                    if caption.strip():
                        chunks.append({
                            "document_id": document_id,
                            "page_number": page_number,
                            "section_title": sec_title,
                            "chunk_order": chunk_order,
                            "chunk_text": f"### Visual Figure: {sec_title}\n{caption}",
                            "char_start": 0,
                            "char_end": len(caption),
                            "bbox": sec_bbox,
                            "ocr_confidence": ocr_conf,
                            "content_type": "image"
                        })
                        chunk_order += 1
                    continue

                # 3. Headings & Text sections
                raw_text = section.get("text", "")
                if not raw_text.strip():
                    continue

                # If text fits in target chunk size
                if len(raw_text) <= cls.DEFAULT_CHUNK_SIZE:
                    formatted_text = f"### {sec_title}\n{raw_text}" if sec_title and sec_title != "General" else raw_text
                    chunks.append({
                        "document_id": document_id,
                        "page_number": page_number,
                        "section_title": sec_title,
                        "chunk_order": chunk_order,
                        "chunk_text": formatted_text,
                        "char_start": 0,
                        "char_end": len(raw_text),
                        "bbox": sec_bbox,
                        "ocr_confidence": ocr_conf,
                        "content_type": sec_type
                    })
                    chunk_order += 1
                else:
                    # Recursive sliding-window chunking with overlap
                    start = 0
                    while start < len(raw_text):
                        end = min(start + cls.DEFAULT_CHUNK_SIZE, len(raw_text))
                        
                        # Adjust split boundary to sentence or space if not at end
                        if end < len(raw_text):
                            space_idx = raw_text.rfind(" ", start, end)
                            if space_idx > start + cls.DEFAULT_CHUNK_SIZE // 2:
                                end = space_idx

                        chunk_sub = raw_text[start:end].strip()
                        if chunk_sub:
                            formatted_text = f"### {sec_title}\n{chunk_sub}" if sec_title and sec_title != "General" else chunk_sub
                            chunks.append({
                                "document_id": document_id,
                                "page_number": page_number,
                                "section_title": sec_title,
                                "chunk_order": chunk_order,
                                "chunk_text": formatted_text,
                                "char_start": start,
                                "char_end": end,
                                "bbox": sec_bbox,
                                "ocr_confidence": ocr_conf,
                                "content_type": sec_type
                            })
                            chunk_order += 1

                        if end >= len(raw_text):
                            break
                        start = max(start + 1, end - cls.DEFAULT_CHUNK_OVERLAP)

        return chunks
