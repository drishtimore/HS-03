from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models.document import Chunk, Document
from backend.retrieval.embedder import Embedder
from backend.retrieval.bm25 import BM25Index
from backend.retrieval.reranker import CrossEncoderReranker
from backend.core.config import settings

class HybridSearchEngine:
    """
    Hybrid Retrieval Engine with Reciprocal Rank Fusion (RRF) and Re-ranking (PRD §5.4 & §12).
    Combines dense vector cosine similarity and sparse BM25 keyword rankings.
    """

    RRF_K = 60  # Standard Reciprocal Rank Fusion constant

    @classmethod
    def search(
        cls,
        db: Session,
        workspace_id: str,
        query: str,
        active_document_ids: Optional[List[str]] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        # 1. Fetch candidate chunks scoped to workspace and optional pinned documents (FR-20, FR-26)
        query_filter = db.query(Chunk, Document.filename, Document.doc_type).join(
            Document, Chunk.document_id == Document.id
        ).filter(Document.workspace_id == workspace_id)

        if active_document_ids and len(active_document_ids) > 0:
            query_filter = query_filter.filter(Chunk.document_id.in_(active_document_ids))

        rows = query_filter.all()
        if not rows:
            return []

        # Prepare chunk dicts for retrieval
        corpus_chunks = []
        for chunk_obj, filename, doc_type in rows:
            corpus_chunks.append({
                "id": chunk_obj.id,
                "document_id": chunk_obj.document_id,
                "document_name": filename,
                "doc_type": doc_type,
                "section_id": chunk_obj.section_id,
                "chunk_text": chunk_obj.chunk_text,
                "chunk_order": chunk_obj.chunk_order,
                "page_number": chunk_obj.page_number,
                "bbox": chunk_obj.bbox,
                "ocr_confidence": chunk_obj.ocr_confidence,
                "embedding": chunk_obj.embedding
            })

        # 2. Dense Vector Retrieval (Cosine Similarity)
        query_embedding = Embedder.get_embedding(query)
        dense_scored = []
        for chunk in corpus_chunks:
            chunk_vec = chunk.get("embedding")
            if chunk_vec:
                sim = Embedder.cosine_similarity(query_embedding, chunk_vec)
                dense_scored.append((chunk, sim))

        # Sort dense top-50
        dense_ranked = sorted(dense_scored, key=lambda x: x[1], reverse=True)[:settings.RETRIEVAL_TOP_K_DENSE]

        # 3. Sparse BM25 Keyword Retrieval
        bm25_index = BM25Index(corpus_chunks)
        sparse_ranked = bm25_index.search(query, top_k=settings.RETRIEVAL_TOP_K_SPARSE)

        # 4. Reciprocal Rank Fusion (RRF)
        # RRF(d) = sum( 1 / (60 + rank) )
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}
        raw_scores: Dict[str, float] = {}

        # Accumulate dense ranks
        for rank, (chunk, score) in enumerate(dense_ranked):
            cid = chunk["id"]
            chunk_map[cid] = chunk
            raw_scores[cid] = score
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (cls.RRF_K + (rank + 1)))

        # Accumulate BM25 ranks
        for rank, (chunk, score) in enumerate(sparse_ranked):
            cid = chunk["id"]
            chunk_map[cid] = chunk
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (cls.RRF_K + (rank + 1)))
            # If not in raw_scores or lower, blend
            if cid not in raw_scores:
                raw_scores[cid] = min(0.9, score / 10.0)

        # Sort combined RRF candidates
        fused_candidates = []
        for cid, rrf_score in rrf_scores.items():
            fused_candidates.append({
                "chunk": chunk_map[cid],
                "score": raw_scores.get(cid, 0.5),
                "rrf_score": rrf_score
            })

        fused_candidates.sort(key=lambda x: x["rrf_score"], reverse=True)

        # 5. Cross-Encoder Re-ranking Stage (PRD §5.4 FR-22 & §12)
        top_candidates = fused_candidates[:50]
        reranked_results = CrossEncoderReranker.rerank(query, top_candidates, top_k=top_k)

        # 6. Deduplicate & Format Evidence Output
        final_evidence = []
        seen_texts = set()

        for item in reranked_results:
            chunk = item["chunk"]
            text_snippet = chunk["chunk_text"].strip()
            # Prevent duplicate snippets
            normalized_key = text_snippet[:80].lower()
            if normalized_key in seen_texts:
                continue
            seen_texts.add(normalized_key)

            final_evidence.append({
                "document_id": chunk["document_id"],
                "document_name": chunk["document_name"],
                "page_number": chunk["page_number"],
                "section_title": chunk.get("section_title") or f"Page {chunk['page_number']}",
                "snippet": text_snippet,
                "score": item["rerank_score"],
                "ocr_confidence": chunk.get("ocr_confidence"),
                "bbox": chunk.get("bbox")
            })

        return final_evidence
