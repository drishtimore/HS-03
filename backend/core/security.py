import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hashes password with SHA256 and salt."""
    salt = settings.PASSWORD_SALT
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_jwt_token(payload: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates standard JWT token using HMAC-SHA256."""
    header = {"alg": settings.JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    
    token_payload = payload.copy()
    expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    exp = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=expire_minutes))
    token_payload["exp"] = int(exp.timestamp())
    payload_b64 = base64.urlsafe_b64encode(json.dumps(token_payload).encode()).decode().rstrip("=")
    
    signature_data = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(settings.JWT_SECRET.encode(), signature_data, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a standard JWT token."""
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure"
        )
    header_b64, payload_b64, sig_b64 = parts
    
    # Pad base64 strings
    def pad(s: str) -> bytes:
        return base64.urlsafe_b64decode(s + "=" * ((4 - len(s) % 4) % 4))
    
    signature_data = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(settings.JWT_SECRET.encode(), signature_data, hashlib.sha256).digest()
    
    try:
        actual_sig = pad(sig_b64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature encoding")
        
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")
        
    try:
        payload_bytes = pad(payload_b64)
        payload = json.loads(payload_bytes.decode())
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    exp = payload.get("exp")
    if exp and datetime.now(timezone.utc).timestamp() > exp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        
    return payload

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Optional[Dict[str, Any]]:
    """Returns current user payload from token if present, or None."""
    if not auth or not auth.credentials:
        return None
    try:
        return decode_jwt_token(auth.credentials)
    except HTTPException:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """Requires authenticated user with valid JWT token."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    return decode_jwt_token(auth.credentials)
