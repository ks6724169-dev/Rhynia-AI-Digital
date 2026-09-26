"""
Rhynia Intelligence SaaS — Authentication API Endpoints
"""

import logging
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import (
    create_access_token,
    create_password_reset_token,
    get_current_user,
    hash_password,
    store_phone_otp,
    verify_password,
    verify_password_reset_token,
    verify_phone_otp,
)
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import User, get_db

logger = logging.getLogger("rhynia.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)


class UserLoginRequest(BaseModel):
    identifier: Optional[str] = None  # email or username
    email: Optional[str] = None
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # ID token or simulated email in dev


class PhoneSendOTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)


class PhoneVerifyOTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)
    otp_code: str = Field(..., min_length=4, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone_number: Optional[str]
    plan_tier: str
    daily_messages_used: int
    storage_used_bytes: int
    is_verified: bool

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# 1. REGISTER (EMAIL + PASSWORD)
# ==========================================
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with email and password."""
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Derive username if not provided
    username = req.username
    if not username:
        base_name = req.email.split("@")[0]
        # Clean non-alphanumeric chars
        base_name = re.sub(r"[^a-zA-Z0-9_]", "", base_name)
        username = base_name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_name}_{counter}"
            counter += 1
    else:
        if db.query(User).filter(User.username == username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another.",
            )

    new_user = User(
        email=req.email.lower(),
        username=username,
        hashed_password=hash_password(req.password),
        phone_number=req.phone_number,
        plan_tier="free",
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email})
    return AuthResponse(access_token=token, user=new_user)


# ==========================================
# 2. LOGIN (EMAIL OR USERNAME + PASSWORD)
# ==========================================
@router.post("/login", response_model=AuthResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email/username and password."""
    raw_id = req.identifier or req.email
    if not raw_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is required."
        )
    identifier = raw_id.strip().lower()

    user = (
        db.query(User)
        .filter((User.email == identifier) | (User.username == identifier))
        .first()
    )

    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email and password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(access_token=token, user=user)


# ==========================================
# 3. GOOGLE OAUTH
# ==========================================
@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register via Google OAuth."""
    # In development mode, accept email if format is test, or parse token
    credential = req.credential.strip()
    email = None

    if "@" in credential and not credential.startswith("eyJ"):
        email = credential.lower()
    else:
        # In production, verify with Google tokeninfo endpoint
        import httpx

        try:
            resp = httpx.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email", "").lower()
            else:
                # Fallback for dev mode
                if settings.ENVIRONMENT == "development":
                    email = f"google_user_{credential[:8]}@rhynia.com"
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Google authentication token verification failed.",
                    )
        except Exception:
            if settings.ENVIRONMENT == "development":
                email = "google_user@rhynia.com"
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not verify Google credentials.",
                )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        base_name = email.split("@")[0]
        base_name = re.sub(r"[^a-zA-Z0-9_]", "", base_name)
        username = base_name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_name}_{counter}"
            counter += 1

        user = User(
            email=email,
            username=username,
            hashed_password=None,
            plan_tier="free",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(access_token=token, user=user)


# ==========================================
# 4. PHONE OTP: SEND
# ==========================================
@router.post("/phone/send-otp")
def send_phone_otp(req: PhoneSendOTPRequest, db: Session = Depends(get_db)):
    """Generate and dispatch a 4-digit OTP for phone verification."""
    clean_phone = re.sub(r"[^\d+]", "", req.phone_number.strip())
    otp_code = store_phone_otp(db, clean_phone)

    # In development mode, log the OTP directly to console
    logger.info(f"[RHYNIA PHONE OTP] Generated code for {clean_phone}: {otp_code}")
    print(f"\n==========================================")
    print(f"  [RHYNIA PHONE OTP] {clean_phone} -> {otp_code}")
    print(f"==========================================\n")

    return {
        "status": "sent",
        "phone_number": clean_phone,
        "message": "Verification code has been sent.",
        # Expose in dev mode for easy testing
        "dev_code": otp_code if settings.ENVIRONMENT == "development" else None,
    }


# ==========================================
# 5. PHONE OTP: VERIFY
# ==========================================
@router.post("/phone/verify-otp", response_model=AuthResponse)
def verify_otp(req: PhoneVerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify phone OTP and authenticate/register user."""
    clean_phone = re.sub(r"[^\d+]", "", req.phone_number.strip())
    is_valid = verify_phone_otp(db, clean_phone, req.otp_code.strip())

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Find or create user for this phone number
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user:
        clean_suffix = clean_phone[-4:]
        username = f"user_{clean_suffix}"
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"user_{clean_suffix}_{counter}"
            counter += 1

        user = User(
            phone_number=clean_phone,
            username=username,
            hashed_password=None,
            plan_tier="free",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "phone_number": user.phone_number})
    return AuthResponse(access_token=token, user=user)


# ==========================================
# 6. FORGOT PASSWORD
# ==========================================
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Trigger password reset email/link."""
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Always return success to prevent email enumeration
    reset_token = None
    if user:
        reset_token = create_password_reset_token(email)
        print(f"\n==========================================")
        print(f"  [RHYNIA PASSWORD RESET] Email: {email}")
        print(f"  Reset Token: {reset_token}")
        print(f"==========================================\n")

    return {
        "status": "success",
        "message": "If an account exists with this email, password reset instructions have been dispatched.",
        "dev_reset_token": reset_token if settings.ENVIRONMENT == "development" else None,
    }


# ==========================================
# 7. RESET PASSWORD
# ==========================================
@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Set a new password using a verified reset token."""
    email = verify_password_reset_token(req.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    user.hashed_password = hash_password(req.new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Your password has been successfully updated. You may now sign in.",
    }


# ==========================================
# 8. CURRENT USER PROFILE (/me)
# ==========================================
@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the currently authenticated user's profile and limits."""
    return current_user
