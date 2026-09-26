from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_optional
from backend.models.conversation import (
    Conversation, Message,
    ConversationCreate, ConversationResponse, MessageResponse,
    QueryRequest, QueryResponse
)
from backend.models.user import Workspace
from backend.services.conversation_service import ConversationService

router = APIRouter(tags=["conversations"])

@router.post("/workspaces/{workspace_id}/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    workspace_id: str,
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    user_id = current_user.get("sub") if current_user else None
    conv = Conversation(
        workspace_id=workspace_id,
        user_id=user_id,
        title=data.title or "New Research Session",
        active_document_ids=data.active_document_ids or []
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        workspace_id=conv.workspace_id,
        title=conv.title,
        active_document_ids=conv.active_document_ids,
        created_at=conv.created_at,
        message_count=0
    )

@router.get("/workspaces/{workspace_id}/conversations", response_model=List[ConversationResponse])
def list_conversations(workspace_id: str, db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(Conversation.workspace_id == workspace_id).order_by(Conversation.created_at.desc()).all()
    results = []
    for c in convs:
        count = db.query(Message).filter(Message.conversation_id == c.id).count()
        results.append(
            ConversationResponse(
                id=c.id,
                workspace_id=c.workspace_id,
                title=c.title,
                active_document_ids=c.active_document_ids or [],
                created_at=c.created_at,
                message_count=count
            )
        )
    return results

@router.get("/conversations/{conversation_id}")
def get_conversation_history(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return {
        "conversation_id": conv.id,
        "workspace_id": conv.workspace_id,
        "title": conv.title,
        "active_document_ids": conv.active_document_ids or [],
        "created_at": conv.created_at,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "rewritten_query": m.rewritten_query,
                "confidence_level": m.confidence_level,
                "citations": m.citations or [],
                "conflicts_detected": m.conflicts_detected,
                "conflict_details": m.conflict_details,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

@router.post("/conversations/{conversation_id}/messages", response_model=QueryResponse)
def send_message(
    conversation_id: str,
    payload: QueryRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Submits user query, rewrites using conversation history, retrieves via Hybrid RRF,
    checks confidence gate (<0.35 refusal), detects cross-source conflicts,
    and returns grounded answer with verifiable citations (PRD §5.5, §5.6, §5.7 & §12).
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")

    user_id = current_user.get("sub") if current_user else None

    result = ConversationService.process_query(
        db=db,
        workspace_id=conv.workspace_id,
        conversation_id=conversation_id,
        user_query=payload.query,
        active_document_ids=payload.active_document_ids,
        user_id=user_id
    )

    return QueryResponse(
        answer=result["answer"],
        confidence_level=result["confidence_level"],
        citations=result["citations"],
        conflicts_detected=result["conflicts_detected"],
        conflict_details=result["conflict_details"],
        rewritten_query=result["rewritten_query"]
    )

@router.patch("/conversations/{conversation_id}/scope")
def update_document_scope(
    conversation_id: str, 
    active_document_ids: List[str], 
    db: Session = Depends(get_db)
):
    """Updates pinned subset of active documents for this session (PRD FR-26)."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")

    conv.active_document_ids = active_document_ids
    db.commit()
    return {"status": "ok", "active_document_ids": active_document_ids}
