from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_optional
from backend.models.user import Workspace, Organization, WorkspaceCreate, WorkspaceResponse
from backend.models.document import Document
from backend.models.audit import AuditLog

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).all()
    results = []
    for ws in workspaces:
        doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
        results.append(
            WorkspaceResponse(
                id=ws.id,
                organization_id=ws.organization_id,
                name=ws.name,
                strict_mode=ws.strict_mode,
                created_at=ws.created_at,
                document_count=doc_count
            )
        )
    return results

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    data: WorkspaceCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    org = db.query(Organization).first()
    org_id = org.id if org else None

    ws = Workspace(
        organization_id=org_id,
        name=data.name,
        strict_mode=data.strict_mode
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)

    # Log audit
    audit = AuditLog(
        user_id=current_user.get("sub") if current_user else None,
        action="create_workspace",
        target_id=ws.id,
        details={"name": data.name, "strict_mode": data.strict_mode}
    )
    db.add(audit)
    db.commit()

    return WorkspaceResponse(
        id=ws.id,
        organization_id=ws.organization_id,
        name=ws.name,
        strict_mode=ws.strict_mode,
        created_at=ws.created_at,
        document_count=0
    )

@router.get("/{id}", response_model=WorkspaceResponse)
def get_workspace(id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
    return WorkspaceResponse(
        id=ws.id,
        organization_id=ws.organization_id,
        name=ws.name,
        strict_mode=ws.strict_mode,
        created_at=ws.created_at,
        document_count=doc_count
    )

@router.patch("/{id}/strict-mode", response_model=WorkspaceResponse)
def toggle_strict_mode(
    id: str, 
    strict_mode: bool, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    ws.strict_mode = strict_mode
    db.commit()

    audit = AuditLog(
        user_id=current_user.get("sub") if current_user else None,
        action="update_workspace_strict_mode",
        target_id=ws.id,
        details={"strict_mode": strict_mode}
    )
    db.add(audit)
    db.commit()

    doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
    return WorkspaceResponse(
        id=ws.id,
        organization_id=ws.organization_id,
        name=ws.name,
        strict_mode=ws.strict_mode,
        created_at=ws.created_at,
        document_count=doc_count
    )
