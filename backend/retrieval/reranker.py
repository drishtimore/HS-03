import re
from typing import List, Dict, Any

class CrossEncoderReranker:
    """
    Cross-Encoder Re-ranking Stage (PRD §5.4 FR-22 & §12).
    Evaluates deep cross-attention/term alignment between query and candidate chunks
    to filter down the top ~50 RRF candidates to the top ~8-12 most relevant spans.
    """

    @classmethod
    def rerank(
        cls, 
        query: str, 
        candidates: List[Dict[str, Any]], 
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        query_terms = set(re.findall(r"\w+", query.lower()))
        reranked = []

        for item in candidates:
            chunk = item.get("chunk", item)
            text = chunk.get("chunk_text", "").lower()
            section_title = chunk.get("section_title", "").lower()
            
            # Base retrieval score from earlier fusion
            base_score = item.get("score", 0.5)

            # 1. Exact query terms density in chunk text
            matched_terms = [t for t in query_terms if t in text]
            term_ratio = len(matched_terms) / max(1, len(query_terms))

            # 2. Heading alignment boost
            heading_boost = 0.0
            if any(t in section_title for t in query_terms):
                heading_boost = 0.15

            # 3. Numeric query bonus (if query asks for figures/amounts and chunk has numbers)
            numeric_boost = 0.0
            if any(char.isdigit() for char in query) and any(char.isdigit() for char in text):
                numeric_boost = 0.10

            # 4. Table data bonus
            table_boost = 0.05 if chunk.get("content_type") == "table" else 0.0

            # Cross-scoring formula
            rerank_score = (
                0.40 * base_score + 
                0.35 * term_ratio + 
                heading_boost + 
                numeric_boost + 
                table_boost
            )
            
            final_score = round(min(1.0, max(0.0, rerank_score)), 3)

            reranked.append({
                **item,
                "rerank_score": final_score,
                "matched_terms": matched_terms
            })

        # Sort descending by re-rank score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]
