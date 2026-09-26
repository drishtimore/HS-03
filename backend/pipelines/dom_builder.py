import os
from typing import Dict, Any, List
from backend.pipelines.classifier import DocumentClassifier
from backend.pipelines.pdf_native import NativePDFPipeline
from backend.pipelines.ocr_engine import OCREnginePipeline
from backend.pipelines.table_extractor import TableExtractorPipeline
from backend.pipelines.vision import VisionPipeline

class DOMBuilder:
    """
    Unified Document Object Model (DOM) Builder (PRD §5.2 FR-8 & §8.2).
    Routes any document format through the appropriate pipeline and produces
    the standardized DOM schema for downstream semantic chunking, indexing, and UI viewer.
    """

    @classmethod
    def build_dom(cls, document_id: str, file_path: str) -> Dict[str, Any]:
        doc_type, classification_meta = DocumentClassifier.classify(file_path)
        
        # Route to respective pipeline
        if doc_type == "native_pdf":
            raw_result = NativePDFPipeline.process(file_path)
        elif doc_type == "scanned_pdf":
            raw_result = OCREnginePipeline.process_scanned_pdf(file_path)
        elif doc_type == "table_doc":
            ext = os.path.splitext(file_path)[1].lower()
            if ext in [".csv", ".tsv"]:
                raw_result = TableExtractorPipeline.extract_from_csv(file_path)
            elif ext in [".xlsx", ".xls"]:
                raw_result = TableExtractorPipeline.extract_from_xlsx(file_path)
            else:
                raw_result = NativePDFPipeline.process(file_path)
        elif doc_type == "image":
            page_data = OCREnginePipeline.extract_from_image(file_path, page_number=1)
            caption = VisionPipeline.generate_caption(file_path)
            # Add image caption section
            page_data["sections"].append({
                "type": "image",
                "section_title": "Visual Analysis",
                "section_order": len(page_data["sections"]),
                "caption": caption,
                "bbox": [20.0, 20.0, float(page_data["width"] - 20), float(page_data["height"] - 20)],
                "ocr_confidence": page_data["ocr_confidence"]
            })
            raw_result = {
                "doc_type": "image",
                "page_count": 1,
                "pages": [{"page_number": 1, "sections": page_data["sections"]}],
                "metadata": {
                    "title": os.path.basename(file_path),
                    "page_count": 1,
                    "avg_ocr_confidence": page_data["ocr_confidence"]
                }
            }
        else: # office_doc / text
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            tables = TableExtractorPipeline.detect_and_parse_text_tables(content)
            sections = []
            
            # Paragraphs
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            for idx, p in enumerate(paragraphs):
                sections.append({
                    "type": "text",
                    "section_title": f"Section {idx+1}",
                    "section_order": idx,
                    "text": p,
                    "bbox": [50.0, 50.0 * idx, 550.0, 50.0 * (idx + 1)],
                    "ocr_confidence": None
                })
            # Add detected tables
            for t_idx, t in enumerate(tables):
                sections.append({
                    "type": "table",
                    "section_title": f"Extracted Table {t_idx+1}",
                    "section_order": len(sections),
                    "text": t["text"],
                    "data": t["data"],
                    "bbox": [40.0, 200.0, 560.0, 450.0],
                    "ocr_confidence": 0.98
                })

            raw_result = {
                "doc_type": "office_doc",
                "page_count": 1,
                "pages": [{"page_number": 1, "sections": sections}],
                "metadata": {
                    "title": os.path.basename(file_path),
                    "page_count": 1
                }
            }

        # Structure into unified DOM schema
        unified_dom = {
            "document_id": document_id,
            "doc_type": doc_type,
            "pages": raw_result.get("pages", []),
            "metadata": {
                **classification_meta,
                **raw_result.get("metadata", {}),
                "filename": os.path.basename(file_path),
                "total_pages": raw_result.get("page_count", 1)
            }
        }
        return unified_dom
