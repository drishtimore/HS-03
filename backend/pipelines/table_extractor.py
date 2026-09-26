import csv
import io
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd

class TableExtractorPipeline:
    """
    Extracts structured tables as 2D matrix JSON and Markdown representations
    for numeric/aggregation retrieval (PRD §5.4 FR-23 & §8.2).
    """

    @classmethod
    def matrix_to_markdown(cls, matrix: List[List[Any]]) -> str:
        """Converts a 2D matrix into a clean GitHub-style Markdown table."""
        if not matrix or not matrix[0]:
            return ""
        
        headers = [str(cell).strip() for cell in matrix[0]]
        rows = matrix[1:]
        
        md_lines = []
        md_lines.append("| " + " | ".join(headers) + " |")
        md_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        
        for row in rows:
            # Pad or truncate row to header length
            row_cells = [str(row[i]).strip() if i < len(row) else "" for i in range(len(headers))]
            md_lines.append("| " + " | ".join(row_cells) + " |")
            
        return "\n".join(md_lines)

    @classmethod
    def extract_from_csv(cls, file_path_or_content: str) -> Dict[str, Any]:
        """Parses CSV/TSV spreadsheets into structured table DOM format."""
        if os.path.exists(file_path_or_content):
            df = pd.read_csv(file_path_or_content)
        else:
            df = pd.read_csv(io.StringIO(file_path_or_content))
            
        # Clean nulls
        df = df.fillna("")
        matrix = [df.columns.tolist()] + df.values.tolist()
        markdown = cls.matrix_to_markdown(matrix)

        section = {
            "type": "table",
            "section_title": "Tabular Data Sheet",
            "section_order": 0,
            "text": markdown,
            "data": matrix,
            "bbox": [20.0, 50.0, 580.0, 700.0],
            "ocr_confidence": 1.0
        }

        return {
            "doc_type": "table_doc",
            "page_count": 1,
            "pages": [{
                "page_number": 1,
                "sections": [section]
            }],
            "metadata": {
                "title": os.path.basename(file_path_or_content) if os.path.exists(file_path_or_content) else "CSV Dataset",
                "rows": len(df),
                "columns": len(df.columns)
            }
        }

    @classmethod
    def extract_from_xlsx(cls, file_path: str) -> Dict[str, Any]:
        """Parses multi-sheet Excel workbooks into structured table DOM pages."""
        excel_file = pd.ExcelFile(file_path)
        pages_dom = []

        for idx, sheet_name in enumerate(excel_file.sheet_names):
            df = pd.read_excel(excel_file, sheet_name=sheet_name).fillna("")
            matrix = [df.columns.tolist()] + df.values.tolist()
            markdown = cls.matrix_to_markdown(matrix)

            section = {
                "type": "table",
                "section_title": f"Sheet: {sheet_name}",
                "section_order": 0,
                "text": markdown,
                "data": matrix,
                "bbox": [20.0, 50.0, 580.0, 700.0],
                "ocr_confidence": 1.0
            }

            pages_dom.append({
                "page_number": idx + 1,
                "sections": [section]
            })

        return {
            "doc_type": "table_doc",
            "page_count": len(pages_dom),
            "pages": pages_dom,
            "metadata": {
                "title": os.path.basename(file_path),
                "sheet_names": excel_file.sheet_names
            }
        }

    @classmethod
    def detect_and_parse_text_tables(cls, text: str) -> List[Dict[str, Any]]:
        """
        Detects pipe-delimited or column-aligned tables in raw text.
        """
        tables = []
        lines = [l.strip() for l in text.split("\n")]
        table_buffer = []

        for line in lines:
            if "|" in line:
                table_buffer.append(line)
            else:
                if len(table_buffer) >= 2:
                    parsed_matrix = cls._parse_markdown_table_lines(table_buffer)
                    if parsed_matrix:
                        tables.append({
                            "type": "table",
                            "data": parsed_matrix,
                            "text": cls.matrix_to_markdown(parsed_matrix),
                            "ocr_confidence": 0.95
                        })
                table_buffer = []

        if len(table_buffer) >= 2:
            parsed_matrix = cls._parse_markdown_table_lines(table_buffer)
            if parsed_matrix:
                tables.append({
                    "type": "table",
                    "data": parsed_matrix,
                    "text": cls.matrix_to_markdown(parsed_matrix),
                    "ocr_confidence": 0.95
                })

        return tables

    @classmethod
    def _parse_markdown_table_lines(cls, lines: List[str]) -> Optional[List[List[str]]]:
        matrix = []
        for line in lines:
            if "---" in line:
                continue
            cells = [c.strip() for c in line.split("|") if c.strip() or line.startswith("|")]
            if cells:
                matrix.append(cells)
        return matrix if len(matrix) >= 2 else None
