from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings, STORAGE_DIR
from backend.core.database import init_db
from backend.routes.auth import router as auth_router
from backend.routes.workspaces import router as workspaces_router
from backend.routes.documents import router as documents_router
from backend.routes.conversations import router as conversations_router
from backend.routes.admin import router as admin_router
from backend.routes.ocr import router as ocr_router
from backend.routes.ws import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables, default org, and workspace exist
    init_db()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Document Intelligence & Multi-Source Search Platform with Hybrid RAG, Citation Enforcement, and Live Database Inspection.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration allowing requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage directory for static document & page previews
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Include API v1 Routers (PRD §9)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(workspaces_router, prefix=settings.API_V1_PREFIX)
app.include_router(documents_router, prefix=settings.API_V1_PREFIX)
app.include_router(conversations_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(ocr_router, prefix=settings.API_V1_PREFIX)

# Include WebSocket router
app.include_router(ws_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "database_explorer_url": f"{settings.API_V1_PREFIX}/admin/db-explorer",
        "pipeline_health_url": f"{settings.API_V1_PREFIX}/admin/pipeline-health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
