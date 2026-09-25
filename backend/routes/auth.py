import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict
from fastapi import APIRouter, HTTPException, status
import hmac
import base64
import json

from backend.models.user import UserRegister, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory mock datastore for skeleton prototype
users_db: Dict[str, dict] = {}

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-prototype-jwt-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def hash_password(password: str) -> str:
    """Hashes password with SHA256 and salt."""
    salt = os.getenv("PASSWORD_SALT", "prototype_salt_HS03")
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def create_jwt_token(payload: dict) -> str:
    """Generates standard JWT token using HMAC-SHA256."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    
    token_payload = payload.copy()
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload["exp"] = int(exp.timestamp())
    payload_b64 = base64.urlsafe_b64encode(json.dumps(token_payload).encode()).decode().rstrip("=")
    
    signature_data = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(JWT_SECRET.encode(), signature_data, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    # Validation: passwords match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    email_key = user_data.email.lower()
    if email_key in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    
    record = {
        "id": user_id,
        "full_name": user_data.full_name,
        "email": email_key,
        "hashed_password": hashed_pwd,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users_db[email_key] = record

    token = create_jwt_token({"sub": user_id, "email": email_key})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            full_name=user_data.full_name,
            email=user_data.email,
        ),
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin):
    email_key = login_data.email.lower()
    record = users_db.get(email_key)
    
    if not record or record["hashed_password"] != hash_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    token = create_jwt_token({"sub": record["id"], "email": email_key})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=record["id"],
            full_name=record["full_name"],
            email=record["email"],
        ),
    )
