import os
import sys
import tempfile
import asyncio
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.core.database import init_db, SessionLocal, get_database_stats
from backend.models.user import User, Workspace, Organization
from backend.models.document import Document, DocumentSection, Chunk
from backend.models.conversation import Conversation, Message
from backend.services.ingestion_service import IngestionService
from backend.services.conversation_service import ConversationService
from backend.services.admin_service import AdminService

async def run_e2e_test():
    print("=" * 60)
    print("STARTING BACKEND END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Initialize Database
    init_db()
    db = SessionLocal()
    print("[1/6] Database initialized and all tables verified.")

    # 2. Verify default workspace
    ws = db.query(Workspace).first()
    if not ws:
        org = Organization(name="Test Org")
        db.add(org)
        db.commit()
        ws = Workspace(name="Hackathon Test Workspace", organization_id=org.id)
        db.add(ws)
        db.commit()
    print(f"[2/6] Active Workspace: '{ws.name}' (ID: {ws.id})")

    # 3. Create and fully ingest two test documents
    doc1_content = "Metric,Q1,Q2\nRevenue,12.3M,14.1M\nNet Profit,3.1M,4.2M\nOperating Margin,25%,30%\n"
    temp_csv = tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8")
    temp_csv.write(doc1_content)
    temp_csv.close()

    doc2_content = """Executive Outlook
The company expects steady revenue growth through the remainder of the fiscal year.
Revenue grew from 12.3M to 14.1M quarter over quarter, a 14.6 percent increase.

Risk Factors
Supply-chain delays remain the primary risk to Q3 targets.
Component shortages could impact delivery schedules in international markets.
"""
    temp_txt = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8")
    temp_txt.write(doc2_content)
    temp_txt.close()

    h1 = IngestionService.compute_sha256(temp_csv.name)
    h2 = IngestionService.compute_sha256(temp_txt.name)

    # Remove stale test docs if already present
    for h in [h1, h2]:
        stale = db.query(Document).filter(Document.workspace_id == ws.id, Document.content_hash == h).first()
        if stale:
            db.delete(stale)
    db.commit()

    doc1 = Document(workspace_id=ws.id, filename="Q2_Financial_Report.csv",
                    content_hash=h1, storage_path=temp_csv.name, status="queued")
    db.add(doc1)
    db.commit()

    doc2 = Document(workspace_id=ws.id, filename="Q3_Outlook_Manual.txt",
                    content_hash=h2, storage_path=temp_txt.name, status="queued")
    db.add(doc2)
    db.commit()

    # Await both pipelines fully
    await IngestionService.process_document_pipeline(doc1.id, SessionLocal)
    await IngestionService.process_document_pipeline(doc2.id, SessionLocal)

    # Refresh from DB
    db.expire(doc1); db.expire(doc2)
    db.refresh(doc1); db.refresh(doc2)

    sections_count = db.query(DocumentSection).filter(DocumentSection.document_id.in_([doc1.id, doc2.id])).count()
    chunks_count   = db.query(Chunk).filter(Chunk.document_id.in_([doc1.id, doc2.id])).count()

    print(f"[3/6] Ingested 2 documents:")
    print(f"  - {doc1.filename}  -> Status: {doc1.status} | Type: {doc1.doc_type}")
    print(f"  - {doc2.filename}  -> Status: {doc2.status} | Type: {doc2.doc_type}")
    print(f"  - DOM sections extracted  : {sections_count}")
    print(f"  - Semantic chunks indexed : {chunks_count}")
    assert chunks_count > 0, "Chunks were not created!"

    # 4. Multi-source Conversational Query with Grounded Citations
    conv = Conversation(workspace_id=ws.id, title="Financial & Risk Review")
    db.add(conv)
    db.commit()

    query_1 = "What was the change in revenue between Q1 and Q2, and does the manual mention any risk factors for Q3?"
    print(f"\n[4/6] Executing Grounded Multi-Source Query:")
    print(f"  Query: \"{query_1}\"")

    result_1 = ConversationService.process_query(
        db=db, workspace_id=ws.id,
        conversation_id=conv.id, user_query=query_1
    )

    print(f"  Confidence Level : {result_1['confidence_level']}")
    print(f"  Citations Found  : {len(result_1['citations'])}")
    print(f"  Answer Preview   : {result_1['answer'][:120]}")
    for idx, c in enumerate(result_1["citations"]):
        print(f"    [{idx+1}] {c['document_name']} (Page {c['page_number']}) Score={c['score']:.3f}")
        print(f"         Snippet: {c['snippet'][:80]}...")

    assert len(result_1["citations"]) >= 1,       "FAIL: Expected at least 1 grounded citation!"
    assert result_1["confidence_level"] in ["high", "medium", "low"], "FAIL: Expected a non-insufficient confidence level!"

    # 5. Confidence Gate / Anti-Hallucination Refusal
    query_irrel = "What is the recipe for baking chocolate brownies?"
    print(f"\n[5/6] Testing Confidence Gate & Anti-Hallucination Refusal:")
    print(f"  Query: \"{query_irrel}\"")

    result_ref = ConversationService.process_query(
        db=db, workspace_id=ws.id,
        conversation_id=conv.id, user_query=query_irrel
    )

    print(f"  Response         : \"{result_ref['answer']}\"")
    print(f"  Confidence Level : {result_ref['confidence_level']}")
    assert result_ref["confidence_level"] == "insufficient", "FAIL: Should refuse unrelated query!"
    assert "sufficient information" in result_ref["answer"],  "FAIL: Expected explicit refusal text!"
    print("  -> Gate PASSED: Irrelevant query refused with zero hallucination!")

    # 6. Live Database Inspector
    print("\n[6/6] Live Database Inspector (Presentation View):")
    stats = AdminService.get_db_explorer_data()
    print(f"  Engine        : {stats['engine']}")
    print(f"  Total Tables  : {stats['total_tables']}")
    for tbl, info in stats["tables"].items():
        print(f"    Table '{tbl}': {info['row_count']} rows")

    # Cleanup temp files
    for p in [temp_csv.name, temp_txt.name]:
        try:
            os.remove(p)
        except Exception:
            pass

    db.close()
    print("\n" + "=" * 60)
    print("  ALL BACKEND TESTS PASSED — 100% OPERATIONAL!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
