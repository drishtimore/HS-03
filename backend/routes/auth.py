from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import hash_password, verify_password, create_jwt_token, get_current_user
from backend.models.user import User, Organization, UserRegister, UserLogin, UserResponse, TokenResponse
from backend.models.audit import AuditLog

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Validate password match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    email_key = user_data.email.lower()
    existing_user = db.query(User).filter(User.email == email_key).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    
    # Assign or create organization
    org = db.query(Organization).first()
    org_id = org.id if org else None

    new_user = User(
        email=email_key,
        full_name=user_data.full_name,
        password_hash=hash_password(user_data.password),
        role=user_data.role or "editor",
        organization_id=org_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit entry
    audit = AuditLog(
        user_id=new_user.id,
        action="user_registered",
        target_id=new_user.id,
        details={"email": email_key, "full_name": user_data.full_name}
    )
    db.add(audit)
    db.commit()

    token = create_jwt_token({
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "organization_id": new_user.organization_id
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            full_name=new_user.full_name,
            email=new_user.email,
            role=new_user.role,
            organization_id=new_user.organization_id
        ),
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    email_key = login_data.email.lower()
    user = db.query(User).filter(User.email == email_key).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    token = create_jwt_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "organization_id": user.organization_id
    })

    # Log audit
    audit = AuditLog(
        user_id=user.id,
        action="user_login",
        target_id=user.id,
        details={"email": email_key}
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            organization_id=user.organization_id
        ),
    )

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id
    )
