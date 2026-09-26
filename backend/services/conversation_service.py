import json
import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.models.conversation import Conversation, Message
from backend.models.user import Workspace
from backend.models.audit import AuditLog
from backend.retrieval.hybrid_search import HybridSearchEngine
from backend.core.config import settings

class ConversationService:
    """
    Conversational RAG Service (PRD §5.5, §5.6, §5.7 & §12).
    - Multi-turn query rewriting
    - Evidence retrieval with Hybrid RRF & Re-ranking
    - Retrieval confidence gating (< 0.35 direct refusal)
    - Conflict detection across distinct documents
    - Grounded, citation-forced answer synthesis
    """

    SYSTEM_PROMPT = """You are an Intelligent Document Intelligence Assistant.
Answer the user's question ONLY using the factual evidence provided below.
CRITICAL RULES:
1. Every factual statement must be immediately followed by a citation marker like [1], [2] corresponding to the evidence list.
2. If the evidence does not contain sufficient information to answer the question, you must respond EXACTLY with:
"I don't have sufficient information in the provided documents to answer this."
3. If two or more sources present conflicting facts or numbers, explicitly state the disagreement and cite each contradictory source (e.g., "[1] states X, whereas [2] reports Y").
4. Never speculate, assume, or use external knowledge outside the provided evidence.

EVIDENCE:
{evidence_block}

QUESTION: {query}
"""

    @classmethod
    def rewrite_query(
        cls, 
        current_query: str, 
        history: List[Message]
    ) -> str:
        """
        PRD §5.5 FR-25: Resolves pronouns and references from prior turns
        into a self-contained search query.
        """
        if not history:
            return current_query

        # Check if current query has pronouns or short references
        pronouns = {"it", "its", "they", "their", "that", "those", "this", "these", "the same", "he", "she"}
        words = set(re.findall(r"\w+", current_query.lower()))
        
        has_pronoun_reference = bool(words.intersection(pronouns)) or len(words) < 5

        if not has_pronoun_reference:
            return current_query

        # Inspect last user message and assistant response
        last_user_msg = next((m.content for m in reversed(history) if m.role == "user"), "")
        if last_user_msg:
            # Extract key nouns/entities from last turn
            entity_words = [w for w in re.findall(r"[A-Z][a-zA-Z0-9]+|\b\d{4}\b", last_user_msg)]
            if entity_words:
                context_str = " ".join(entity_words[:3])
                return f"{current_query} regarding {context_str}"
            else:
                return f"{current_query} (context: {last_user_msg[:80]})"

        return current_query

    @classmethod
    def detect_conflicts(cls, evidence: List[Dict[str, Any]]) -> Tuple[bool, Optional[List[Dict[str, Any]]]]:
        """
        PRD §5.7 FR-33 & §13: Detects contradicting numbers or facts
        between different documents in the retrieved evidence set.
        """
        if len(evidence) < 2:
            return False, None

        # Group by document
        doc_snippets: Dict[str, List[Dict[str, Any]]] = {}
        for item in evidence:
            doc_id = item["document_id"]
            doc_snippets.setdefault(doc_id, []).append(item)

        if len(doc_snippets) < 2:
            return False, None

        conflicts = []
        
        # Look for metric/amount discrepancies across documents
        # Pattern: currency or numbers followed by million/billion/percent
        metric_pattern = re.compile(r"(\$?\d+(\.\d+)?\s*(%|million|billion|M|B|USD|EUR)?)", re.IGNORECASE)
        
        doc_metrics: List[Tuple[str, str, str, str]] = []  # (doc_name, number, context, snippet)
        for doc_id, items in doc_snippets.items():
            for it in items:
                matches = metric_pattern.findall(it["snippet"])
                for match in matches:
                    val = match[0].strip()
                    if len(val) > 1:
                        doc_metrics.append((it["document_name"], val, it["section_title"], it["snippet"]))

        # Check if multiple documents cite different numbers for similar section topics
        for i in range(len(doc_metrics)):
            for j in range(i + 1, len(doc_metrics)):
                doc_a, val_a, sec_a, snip_a = doc_metrics[i]
                doc_b, val_b, sec_b, snip_b = doc_metrics[j]

                if doc_a != doc_b and val_a != val_b and sec_a.lower() == sec_b.lower() and sec_a:
                    conflicts.append({
                        "topic": f"Discrepancy in {sec_a}",
                        "explanation": f"Source '{doc_a}' reports {val_a}, while source '{doc_b}' reports {val_b}.",
                        "claims": [
                            {"document": doc_a, "value": val_a, "snippet": snip_a[:120]},
                            {"document": doc_b, "value": val_b, "snippet": snip_b[:120]}
                        ]
                    })

        return (len(conflicts) > 0), (conflicts if conflicts else None)

    @classmethod
    def synthesize_answer(
        cls, 
        query: str, 
        evidence: List[Dict[str, Any]], 
        conflicts_detected: bool = False,
        conflict_details: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generates grounded, citation-indexed answer via LLM API or deterministic RAG synthesizer.
        """
        # Format Evidence Block
        evidence_lines = []
        for idx, ev in enumerate(evidence):
            marker = f"[{idx + 1}]"
            evidence_lines.append(
                f"{marker} (doc: {ev['document_name']}, page {ev['page_number']}, section: {ev['section_title']}): \"{ev['snippet']}\""
            )
        evidence_block = "\n".join(evidence_lines)

        # 1. Try Gemini API (free tier, best for hackathon demos)
        if settings.GEMINI_API_KEY:
            try:
                import httpx
                prompt_text = cls.SYSTEM_PROMPT.format(evidence_block=evidence_block, query=query)
                resp = httpx.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                    headers={"content-type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt_text}]}],
                        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.2}
                    },
                    timeout=25.0
                )
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        ans = candidates[0]["content"]["parts"][0]["text"].strip()
                        if ans:
                            return ans
            except Exception:
                pass

        # 2. Claude API fallback
        if settings.ANTHROPIC_API_KEY:
            try:
                import httpx
                resp = httpx.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 800,
                        "messages": [{
                            "role": "user",
                            "content": cls.SYSTEM_PROMPT.format(evidence_block=evidence_block, query=query)
                        }]
                    },
                    timeout=20.0
                )
                if resp.status_code == 200:
                    ans = resp.json()["content"][0]["text"].strip()
                    return ans
            except Exception:
                pass

        # 3. Resilient Deterministic Synthesis Engine
        # Builds a structured grounded answer paragraph from top evidence
        intro = f"Based on the retrieved documents, here is what was found regarding your query:\n\n"
        answer_parts = []
        for idx, ev in enumerate(evidence[:5]):
            marker = f"[{idx + 1}]"
            snip = ev["snippet"].replace("###", "").replace("**", "").strip()
            doc_ref = f"({ev['document_name']}, Page {ev['page_number']})"
            # Extract up to 2 clean sentences
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", snip) if s.strip() and len(s.strip()) > 10]
            text = " ".join(sentences[:2]) if sentences else snip[:200]
            answer_parts.append(f"- {text} {marker} {doc_ref}")

        body = "\n".join(answer_parts)
        full_answer = intro + body

        if conflicts_detected and conflict_details:
            c = conflict_details[0]
            conflict_note = f"\n\n⚠️ **Discrepancy Detected:** {c['explanation']}"
            return full_answer + conflict_note

        return full_answer

    @classmethod
    def process_query(
        cls,
        db: Session,
        workspace_id: str,
        conversation_id: str,
        user_query: str,
        active_document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end RAG flow (PRD §12).
        """
        # Fetch conversation history
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise ValueError("Conversation session not found")

        history = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()

        # Check workspace strict_mode
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        strict_mode = ws.strict_mode if ws else False

        # Step 1: Query Rewriting (FR-25)
        rewritten_query = cls.rewrite_query(user_query, history)

        # Step 2: Hybrid Retrieval & Re-ranking (FR-19 to FR-22)
        scope_doc_ids = active_document_ids or conv.active_document_ids or []
        evidence = HybridSearchEngine.search(
            db=db,
            workspace_id=workspace_id,
            query=rewritten_query,
            active_document_ids=scope_doc_ids if len(scope_doc_ids) > 0 else None,
            top_k=settings.RERANKER_TOP_K
        )

        # Record User Message
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=user_query,
            rewritten_query=rewritten_query
        )
        db.add(user_msg)
        db.commit()

        # Step 3: Confidence Gating Check (PRD §5.7 FR-32 & §12)
        max_score = max((ev["score"] for ev in evidence), default=0.0)

        if not evidence or max_score < settings.CONFIDENCE_GATE_THRESHOLD:
            # Gated refusal response: No hallucination!
            refusal_text = "I don't have sufficient information in the provided documents to answer this."
            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=refusal_text,
                rewritten_query=rewritten_query,
                confidence_level="insufficient",
                citations=[],
                conflicts_detected=False
            )
            db.add(assistant_msg)
            
            # Log compliance audit
            audit = AuditLog(
                user_id=user_id,
                action="query_insufficient_evidence",
                target_id=conversation_id,
                details={"query": user_query, "max_score": max_score}
            )
            db.add(audit)
            db.commit()

            return {
                "answer": refusal_text,
                "confidence_level": "insufficient",
                "citations": [],
                "conflicts_detected": False,
                "conflict_details": None,
                "rewritten_query": rewritten_query
            }

        # Step 4: Conflict Check (FR-33 & §13)
        conflicts_found, conflict_details = cls.detect_conflicts(evidence)

        # Step 5: Answer Synthesis
        answer = cls.synthesize_answer(
            query=rewritten_query,
            evidence=evidence,
            conflicts_detected=conflicts_found,
            conflict_details=conflict_details
        )

        # Step 6: Assign Confidence Level (FR-34)
        if max_score >= settings.HIGH_CONFIDENCE_THRESHOLD:
            conf_level = "high"
        elif max_score >= settings.MEDIUM_CONFIDENCE_THRESHOLD:
            conf_level = "medium"
        else:
            conf_level = "low"

        # Persist Assistant Message
        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=answer,
            rewritten_query=rewritten_query,
            confidence_level=conf_level,
            citations=evidence,
            conflicts_detected=conflicts_found,
            conflict_details=conflict_details
        )
        db.add(assistant_msg)

        # Audit log entry
        audit = AuditLog(
            user_id=user_id,
            action="query",
            target_id=conversation_id,
            details={
                "query": user_query,
                "citations_count": len(evidence),
                "confidence_level": conf_level,
                "conflicts_detected": conflicts_found
            }
        )
        db.add(audit)
        db.commit()

        return {
            "answer": answer,
            "confidence_level": conf_level,
            "citations": evidence,
            "conflicts_detected": conflicts_found,
            "conflict_details": conflict_details,
            "rewritten_query": rewritten_query
        }
