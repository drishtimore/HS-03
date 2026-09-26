from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.services.websocket_manager import ws_manager

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/documents/{document_id}")
async def websocket_document_status(websocket: WebSocket, document_id: str):
    """
    Real-time WebSocket stream broadcasting document ingestion progress (PRD §5.2 FR-9 & §9).
    Emits state transitions: queued -> classifying -> extracting -> embedding -> indexed / failed.
    """
    await ws_manager.connect(document_id, websocket)
    try:
        while True:
            # Keep connection open and await any client ping/pong
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(document_id, websocket)
    except Exception:
        ws_manager.disconnect(document_id, websocket)
