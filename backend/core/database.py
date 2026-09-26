import json
from datetime import datetime, timezone
from typing import Generator, Dict, Any, List
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from backend.core.config import settings

# Engine configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session for requests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables if they do not exist and sets up initial workspace."""
    # Import all models to register them with Base.metadata
    from backend.models.user import User, Organization, Workspace
    from backend.models.document import Document, DocumentSection, Chunk
    from backend.models.conversation import Conversation, Message
    from backend.models.audit import AuditLog

    Base.metadata.create_all(bind=engine)

    # Enable SQLite WAL mode for concurrency if SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL;"))
            conn.execute(text("PRAGMA synchronous=NORMAL;"))

    # Seed default Organization and Workspace if empty
    with SessionLocal() as db:
        default_org = db.query(Organization).first()
        if not default_org:
            org = Organization(
                name="Default Organization"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            
            ws = Workspace(
                organization_id=org.id,
                name="General Intelligence Workspace",
                strict_mode=False
            )
            db.add(ws)
            db.commit()

def get_database_stats() -> Dict[str, Any]:
    """
    Returns live database statistics, tables, row counts, and schema.
    Used for the live presentation Database Inspector.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    stats: Dict[str, Any] = {
        "engine": engine.dialect.name,
        "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "total_tables": len(table_names),
        "tables": {}
    }
    
    with engine.connect() as conn:
        for table in table_names:
            columns = [{"name": c["name"], "type": str(c["type"])} for c in inspector.get_columns(table)]
            count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            
            # Fetch last 5 records
            try:
                rows_result = conn.execute(text(f"SELECT * FROM {table} ORDER BY 1 DESC LIMIT 5")).fetchall()
                sample_rows = [dict(row._mapping) for row in rows_result]
                # Convert non-serializable objects (datetime/uuid) to string
                cleaned_rows = []
                for r in sample_rows:
                    cleaned_r = {}
                    for k, v in r.items():
                        if isinstance(v, (datetime, bytes)):
                            cleaned_r[k] = str(v)
                        else:
                            cleaned_r[k] = v
                    cleaned_rows.append(cleaned_r)
            except Exception:
                cleaned_rows = []

            stats["tables"][table] = {
                "row_count": count_result,
                "columns": columns,
                "recent_rows": cleaned_rows
            }
            
    return stats
