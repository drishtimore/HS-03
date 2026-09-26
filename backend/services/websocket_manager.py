import json
from typing import Dict, List, Any
from fastapi import WebSocket

class WebSocketConnectionManager:
    """
    Manages active WebSocket connections for live document ingestion status streaming (PRD §5.2 FR-9 & §9).
    """

    def __init__(self):
        # Maps document_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, document_id: str, websocket: WebSocket):
        await websocket.accept()
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
        self.active_connections[document_id].append(websocket)

    def disconnect(self, document_id: str, websocket: WebSocket):
        if document_id in self.active_connections:
            if websocket in self.active_connections[document_id]:
                self.active_connections[document_id].remove(websocket)
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]

    async def broadcast_status(
        self, 
        document_id: str, 
        status: str, 
        progress: int, 
        stage_message: str,
        error_reason: str = None
    ):
        """Broadcasts status update to all connected subscribers for this document."""
        if document_id not in self.active_connections:
            return

        payload = {
            "document_id": document_id,
            "status": status,
            "progress": progress,
            "stage_message": stage_message,
            "error_reason": error_reason
        }
        
        # Dead connections cleaner
        disconnected = []
        for connection in self.active_connections[document_id]:
            try:
                await connection.send_text(json.dumps(payload))
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(document_id, conn)

ws_manager = WebSocketConnectionManager()
