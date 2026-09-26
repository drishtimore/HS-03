import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
DB_DIR = BASE_DIR / "database"

# Ensure runtime directories exist
for folder in [STORAGE_DIR, UPLOAD_DIR, PROCESSED_DIR, DB_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Document Intelligence & Multi-Source Search Platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    
    # Database
    # Default is SQLite for instant live demo / local run, but if DATABASE_URL is set (PostgreSQL/pgvector), it seamlessly connects.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DB_DIR / 'docintel.db'}"
    )
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-prototype-jwt-key-hs03-docintel")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    PASSWORD_SALT: str = os.getenv("PASSWORD_SALT", "prototype_salt_HS03")
    
    # File limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "200"))
    ASYNC_PROCESSING_THRESHOLD_MB: int = int(os.getenv("ASYNC_PROCESSING_THRESHOLD_MB", "20"))
    
    # LLM & Embedding configuration
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "hybrid-semantic-embedder-v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "claude-3-5-sonnet")
    
    # Retrieval & Confidence parameters (PRD §5.7, §12)
    CONFIDENCE_GATE_THRESHOLD: float = float(os.getenv("CONFIDENCE_GATE_THRESHOLD", "0.10"))
    HIGH_CONFIDENCE_THRESHOLD: float = float(os.getenv("HIGH_CONFIDENCE_THRESHOLD", "0.60"))
    MEDIUM_CONFIDENCE_THRESHOLD: float = float(os.getenv("MEDIUM_CONFIDENCE_THRESHOLD", "0.30"))
    OCR_CONFIDENCE_THRESHOLD: float = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.60"))
    
    # RAG candidate limits
    RETRIEVAL_TOP_K_DENSE: int = 50
    RETRIEVAL_TOP_K_SPARSE: int = 50
    RERANKER_TOP_K: int = 10
    MAX_SYNTHESIS_DOCS: int = 5

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
