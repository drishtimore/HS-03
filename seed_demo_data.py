"""
Demo Data Seeder — Populates the database with realistic records
so the database looks impressive during presentation to judges.
Run: python seed_demo_data.py
"""
import sys
import asyncio
import tempfile
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

from backend.core.database import init_db, SessionLocal
from backend.core.security import hash_password
from backend.models.user import Organization, User, Workspace
from backend.models.document import Document, DocumentSection, Chunk
from backend.models.conversation import Conversation, Message
from backend.models.audit import AuditLog
from backend.services.ingestion_service import IngestionService

SAMPLE_DOCS = [
    {
        "filename": "Q2_2026_Financial_Report.csv",
        "content": "Metric,Q1 2026,Q2 2026,YoY Change\nRevenue,12.3M,14.1M,+14.6%\nNet Profit,3.1M,4.2M,+35.5%\nOperating Margin,25.2%,29.8%,+4.6pp\nEBITDA,4.8M,5.9M,+22.9%\nCash Flow,2.1M,3.4M,+61.9%\nR&D Spend,1.2M,1.5M,+25.0%\n",
        "suffix": ".csv"
    },
    {
        "filename": "Q3_Outlook_Manual.txt",
        "content": """Q3 2026 Outlook & Risk Assessment

Executive Summary
The organization projects continued revenue expansion through Q3 2026, driven by new enterprise contracts and regional market expansion. Revenue is expected to grow from 14.1M to approximately 16.5M.

Risk Factors
Supply-chain delays remain the primary risk to Q3 targets. Component shortages could impact hardware delivery schedules across international markets.
Geopolitical tensions in key manufacturing regions could increase production costs by an estimated 8-12%.
Currency fluctuation in emerging markets poses a moderate financial risk.

Strategic Initiatives
The company plans to launch three new product lines in Q3. Partnership agreements with regional distributors are finalized. Digital transformation investments are projected to reduce operational costs by 15% by end of Q4.
""",
        "suffix": ".txt"
    },
    {
        "filename": "Annual_Compliance_Report_2025.txt",
        "content": """Annual Compliance Report 2025

Regulatory Compliance Summary
The organization maintained full compliance with ISO 27001 information security standards throughout 2025. GDPR compliance audits were completed with zero critical findings. Data retention policies were updated to reflect new regional regulations.

Audit Findings
Internal audit conducted in Q2 2025 identified three minor process gaps in vendor onboarding. All gaps were remediated within 45 days.
External auditors from DeloittePwC confirmed financial statements are free from material misstatement.

Risk Assessment
Overall organizational risk score improved from Medium (62/100) to Low-Medium (44/100) year over year.
Cybersecurity incident response time improved from 4.2 hours average to 1.8 hours average.
""",
        "suffix": ".txt"
    },
    {
        "filename": "Product_Specification_v3.txt",
        "content": """Product Specification Document v3.0

Product Overview
DocIntel Platform is an enterprise-grade intelligent document processing system supporting multi-format ingestion, OCR extraction, hybrid semantic search, and citation-grounded AI answers.

Technical Specifications
Supported Formats: PDF (native & scanned), PNG, JPG, TIFF, DOCX, XLSX, CSV
Max Document Size: 200MB per file
OCR Accuracy: >= 90% on degraded scans
Query Response Time: P95 <= 6 seconds end-to-end
Concurrent Users: Up to 500 simultaneous sessions

Architecture Components
FastAPI backend with async pipeline orchestration
Hybrid retrieval: Dense vector + BM25 sparse + Reciprocal Rank Fusion
SQLite (dev) / PostgreSQL+pgvector (production)
Real-time WebSocket status streaming
""",
        "suffix": ".txt"
    }
]

async def seed():
    print("=" * 55)
    print("  SEEDING DEMO DATA FOR PRESENTATION")
    print("=" * 55)

    init_db()
    db = SessionLocal()

    # 1. Organization
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Acme Corporation")
        db.add(org)
        db.commit()
    print(f"[OK] Organization: {org.name}")

    # 2. Workspace
    ws = db.query(Workspace).filter(Workspace.organization_id == org.id).first()
    if not ws:
        ws = Workspace(organization_id=org.id, name="Intelligence Research Hub", strict_mode=False)
        db.add(ws)
        db.commit()
    print(f"[OK] Workspace: {ws.name}")

    # 3. Compliance workspace
    ws_compliance = db.query(Workspace).filter(Workspace.strict_mode == True).first()
    if not ws_compliance:
        ws_compliance = Workspace(organization_id=org.id, name="Legal & Compliance Vault", strict_mode=True)
        db.add(ws_compliance)
        db.commit()
    print(f"[OK] Workspace (strict): {ws_compliance.name}")

    # 4. Demo Users
    users_data = [
        ("Priya Sharma", "priya@acme.com", "admin"),
        ("Rahul Verma", "rahul@acme.com", "editor"),
        ("Ananya Singh", "ananya@acme.com", "viewer"),
    ]
    created_users = []
    for full_name, email, role in users_data:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                organization_id=org.id,
                full_name=full_name,
                email=email,
                password_hash=hash_password("Demo@1234"),
                role=role
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            created_users.append(u)
            print(f"[OK] User created: {full_name} ({role})")
        else:
            created_users.append(existing)
            print(f"[--] User exists: {full_name}")

    # 5. Ingest Sample Documents
    print("\n[...] Ingesting sample documents (this takes ~30 seconds)...")
    ingested_docs = []
    for doc_info in SAMPLE_DOCS:
        tmp = tempfile.NamedTemporaryFile(
            "w", suffix=doc_info["suffix"], delete=False, encoding="utf-8"
        )
        tmp.write(doc_info["content"])
        tmp.close()

        content_hash = IngestionService.compute_sha256(tmp.name)
        existing_doc = db.query(Document).filter(
            Document.workspace_id == ws.id,
            Document.content_hash == content_hash
        ).first()

        if existing_doc:
            print(f"  [--] Already indexed: {doc_info['filename']}")
            ingested_docs.append(existing_doc)
            try: os.remove(tmp.name)
            except: pass
            continue

        doc = Document(
            workspace_id=ws.id,
            filename=doc_info["filename"],
            content_hash=content_hash,
            storage_path=tmp.name,
            status="queued",
            uploaded_by=created_users[0].id if created_users else None
        )
        db.add(doc)
        db.commit()
        await IngestionService.process_document_pipeline(doc.id, SessionLocal)
        db.refresh(doc)
        ingested_docs.append(doc)
        print(f"  [OK] Indexed: {doc.filename} | Type: {doc.doc_type} | Status: {doc.status}")

    # 6. Sample Conversations & Messages
    conv = db.query(Conversation).filter(Conversation.workspace_id == ws.id).first()
    if not conv:
        conv = Conversation(
            workspace_id=ws.id,
            user_id=created_users[0].id if created_users else None,
            title="Q2 Financial & Risk Analysis",
            active_document_ids=[d.id for d in ingested_docs]
        )
        db.add(conv)
        db.commit()

    existing_msgs = db.query(Message).filter(Message.conversation_id == conv.id).count()
    if existing_msgs == 0:
        from backend.services.conversation_service import ConversationService

        queries = [
            "What was the change in revenue between Q1 and Q2?",
            "What are the risk factors mentioned for Q3?",
            "What is the net profit margin improvement year over year?",
        ]
        for q in queries:
            try:
                ConversationService.process_query(
                    db=db,
                    workspace_id=ws.id,
                    conversation_id=conv.id,
                    user_query=q,
                    user_id=created_users[0].id if created_users else None
                )
                print(f"  [OK] Q&A stored: \"{q[:55]}...\"")
            except Exception as e:
                print(f"  [WARN] Query failed: {e}")

    # 7. Audit Log entries
    actions = ["user_login", "upload_document", "query", "view_document", "create_workspace"]
    existing_audit = db.query(AuditLog).count()
    if existing_audit < 5:
        for i, action in enumerate(actions):
            log = AuditLog(
                user_id=created_users[i % len(created_users)].id if created_users else None,
                action=action,
                target_id=ws.id,
                details={"demo": True, "action_detail": f"Sample {action} event for presentation"},
                ip_address="192.168.1.10"
            )
            db.add(log)
        db.commit()
        print(f"\n[OK] Audit log seeded with {len(actions)} demo events")

    db.close()

    print("\n" + "=" * 55)
    print("  DEMO DATA SEEDED SUCCESSFULLY!")
    print("=" * 55)
    print("\nDatabase file: database/docintel.db")
    print("Open it with: DB Browser for SQLite")
    print("Live API:      http://localhost:8000/api/v1/admin/db-explorer")
    print("Swagger Docs:  http://localhost:8000/docs")

if __name__ == "__main__":
    asyncio.run(seed())
