"""
Rhynia Intelligence SaaS — Authentication & Security Engine
"""

import random
import re
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import EmailOTP, PhoneOTP, User, get_db


# HTTP Bearer token extractor
security_bearer = HTTPBearer(auto_error=False)


# ==========================================
# 1. PASSWORD HASHING (BCRYPT COST 12)
# ==========================================
def hash_password(password: str) -> str:
    """Hash a password using bcrypt with salt rounds = 12."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ==========================================
# 2. JWT TOKEN GENERATION & VERIFICATION
# ==========================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ==========================================
# 3. OTP GENERATION & VERIFICATION
# ==========================================
def generate_numeric_otp(length: int = 4) -> str:
    """Generate a random numeric OTP code."""
    return "".join(random.choices(string.digits, k=length))


def normalize_phone(phone: str) -> str:
    """Normalize phone number to last 10 digits for consistent OTP matching."""
    if not phone:
        return ""
    digits = re.sub(r"[^\d]", "", phone)
    return digits[-10:] if len(digits) >= 10 else digits


def store_phone_otp(db: Session, phone_number: str) -> str:
    """Generate, store, and return a 6-digit OTP for a phone number."""
    norm_phone = normalize_phone(phone_number)

    # Mark prior unused OTPs for this number as used
    db.query(PhoneOTP).filter(
        PhoneOTP.phone_number == norm_phone, PhoneOTP.is_used == False
    ).update({"is_used": True})

    code = generate_numeric_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)

    otp_record = PhoneOTP(
        phone_number=norm_phone,
        otp_code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)
    return code


def verify_phone_otp(db: Session, phone_number: str, otp_code: str, mark_used: bool = True) -> bool:
    """Validate a submitted phone OTP against normalized phone number."""
    norm_phone = normalize_phone(phone_number)
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(PhoneOTP)
        .filter(
            PhoneOTP.phone_number == norm_phone,
            PhoneOTP.otp_code == otp_code.strip(),
            PhoneOTP.is_used == False,
            PhoneOTP.expires_at > now,
        )
        .first()
    )

    if not otp_record:
        return False

    if mark_used:
        otp_record.is_used = True
        db.commit()
    return True


def store_email_otp(db: Session, email: str) -> str:
    """Generate, store, and return a 6-digit OTP for an email address."""
    clean_email = email.strip().lower()

    # Mark prior unused OTPs for this email as used
    db.query(EmailOTP).filter(
        EmailOTP.email == clean_email, EmailOTP.is_used == False
    ).update({"is_used": True})

    code = generate_numeric_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)

    otp_record = EmailOTP(
        email=clean_email,
        otp_code=code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)
    return code


def verify_email_otp(db: Session, email: str, otp_code: str, mark_used: bool = True) -> bool:
    """Validate a submitted email OTP."""
    clean_email = email.strip().lower()
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == clean_email,
            EmailOTP.otp_code == otp_code.strip(),
            EmailOTP.is_used == False,
            EmailOTP.expires_at > now,
        )
        .first()
    )

    if not otp_record:
        return False

    if mark_used:
        otp_record.is_used = True
        db.commit()
    return True




# ==========================================
# 4. PASSWORD RESET TOKEN
# ==========================================
def create_password_reset_token(email: str) -> str:
    """Generate a short-lived token for password reset (15 minutes)."""
    payload = {
        "sub": email,
        "purpose": "password_reset",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token and return the associated email."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "password_reset":
            return None
        return payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ==========================================
# 5. FASTAPI DEPENDENCY: CURRENT USER
# ==========================================
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to retrieve the authenticated user from JWT Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to Rhynia.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user = db.query(User).filter((User.id == user_id) | (User.email == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated.",
        )

    return user
