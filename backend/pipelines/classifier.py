import os
from pathlib import Path
from typing import Dict, Any, Tuple
import pypdf

class DocumentClassifier:
    """
    Intelligent Document Processing Classifier (PRD §5.2 FR-6).
    Classifies documents into:
      - 'native_pdf': PDF with digital selectable text layer
      - 'scanned_pdf': PDF consisting primarily of scanned raster pages
      - 'table_doc': Documents with dense tabular structures (XLSX, CSV, table-dense PDF)
      - 'image': Standalone image files (PNG, JPG, TIFF)
      - 'office_doc': DOCX, TXT, Markdown, etc.
    """

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}
    TABLE_EXTENSIONS = {".xlsx", ".xls", ".csv", ".tsv"}
    OFFICE_EXTENSIONS = {".docx", ".doc", ".odt", ".rtf", ".txt", ".md"}

    @classmethod
    def classify(cls, file_path: str) -> Tuple[str, Dict[str, Any]]:
        path = Path(file_path)
        ext = path.suffix.lower()
        
        file_size = os.path.getsize(file_path)
        metadata: Dict[str, Any] = {
            "extension": ext,
            "file_size_bytes": file_size,
        }

        # 1. Image classification
        if ext in cls.IMAGE_EXTENSIONS:
            return "image", metadata

        # 2. Tabular spreadsheet formats
        if ext in cls.TABLE_EXTENSIONS:
            return "table_doc", metadata

        # 3. Text/Office documents
        if ext in cls.OFFICE_EXTENSIONS:
            return "office_doc", metadata

        # 4. PDF Analysis (Determine native digital vs scanned vs table-dense)
        if ext == ".pdf":
            try:
                reader = pypdf.PdfReader(file_path)
                page_count = len(reader.pages)
                metadata["page_count"] = page_count
                
                total_chars = 0
                has_images = False
                has_table_patterns = False
                
                # Sample up to first 5 pages for rapid classification
                sample_pages = reader.pages[:min(5, page_count)]
                for page in sample_pages:
                    text = page.extract_text() or ""
                    total_chars += len(text.strip())
                    
                    if len(page.images) > 0:
                        has_images = True
                        
                    # Check for table heuristics (columns, separators, tabs)
                    lines = [line.strip() for line in text.split("\n") if line.strip()]
                    table_like_lines = sum(1 for line in lines if "|" in line or "\t" in line or line.count("  ") >= 3)
                    if len(lines) > 0 and (table_like_lines / len(lines)) > 0.4:
                        has_table_patterns = True

                avg_chars_per_page = total_chars / max(1, len(sample_pages))
                metadata["avg_chars_per_page"] = round(avg_chars_per_page, 2)
                metadata["has_images"] = has_images

                # If text layer is virtually non-existent or tiny, it's a scanned PDF
                if avg_chars_per_page < 50:
                    return "scanned_pdf", metadata
                
                # If dense tables are detected across pages
                if has_table_patterns and avg_chars_per_page > 100:
                    return "table_doc", metadata
                
                # Otherwise, it's a native digital PDF
                return "native_pdf", metadata

            except Exception as e:
                metadata["classification_warning"] = str(e)
                # Fallback to native_pdf
                return "native_pdf", metadata

        return "office_doc", metadata
