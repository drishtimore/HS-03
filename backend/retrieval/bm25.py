import re
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

class BM25Index:
    """
    BM25 Sparse Keyword Retrieval Index (PRD §5.4 FR-19).
    Tokenizes text, computes term frequencies, inverse document frequencies,
    and returns ranked keyword scores.
    """

    STOPWORDS = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
        "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
        "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
        "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more", 
        "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", 
        "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", 
        "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
        "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", 
        "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", 
        "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    }

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = [w for w in cleaned.split() if len(w) > 1 and w not in cls.STOPWORDS]
        return tokens

    def __init__(self, corpus_chunks: List[Dict[str, Any]]):
        self.chunks = corpus_chunks
        self.tokenized_corpus = [self.tokenize(c.get("chunk_text", "")) for c in corpus_chunks]
        if self.tokenized_corpus and any(len(doc) > 0 for doc in self.tokenized_corpus):
            self.bm25 = BM25Okapi(self.tokenized_corpus)
        else:
            self.bm25 = None

    def search(self, query: str, top_k: int = 50) -> List[Tuple[Dict[str, Any], float]]:
        if not self.bm25 or not self.chunks:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        scores = self.bm25.get_scores(query_tokens)
        scored_pairs = list(zip(self.chunks, scores))
        # Filter out 0 scores
        filtered = [pair for pair in scored_pairs if pair[1] > 0.0]
        sorted_pairs = sorted(filtered, key=lambda x: x[1], reverse=True)
        return sorted_pairs[:top_k]
