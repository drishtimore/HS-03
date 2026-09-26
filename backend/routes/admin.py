from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/pipeline-health")
def get_pipeline_health(db: Session = Depends(get_db)):
    """Admin dashboard: ingestion queue health, failure rates, total chunks (PRD §5.8 FR-38)."""
    return AdminService.get_pipeline_health(db)

@router.get("/audit-log")
def get_audit_trail(
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Compliance audit log viewer (PRD §5.8 FR-39 & §14)."""
    return AdminService.get_audit_trail(db, action=action, limit=limit)

@router.get("/db-explorer")
def get_live_database_explorer():
    """
    Live Database Inspector for Presentation to Hackathon Judges.
    Returns active database engine, connection info, tables, schemas, row counts,
    and recent records for real-time verification.
    """
    return AdminService.get_db_explorer_data()
