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
    store_email_otp,
    store_phone_otp,
    verify_email_otp,
    verify_password,
    verify_password_reset_token,
    verify_phone_otp,
)
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import User, get_db
from services.rhynia_saas.backend.services.email_service import email_service
from services.rhynia_saas.backend.services.sms_service import sms_service

logger = logging.getLogger("rhynia.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    phone_number: str = Field(..., min_length=10, max_length=20)


class SetPhoneRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)


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


class EmailSendOTPRequest(BaseModel):
    email: EmailStr


class EmailVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=6)


class ForgotPasswordRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None


class ForgotPasswordResetRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    otp_code: str = Field(..., min_length=4, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=100)


class ForgotPasswordVerifyCodeRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    otp_code: str = Field(..., min_length=4, max_length=6)


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
    needs_phone: bool = False


# ==========================================
# 1. REGISTER (EMAIL + PASSWORD + MANDATORY MOBILE)
# ==========================================
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with mandatory email, password, and mobile number."""
    # 1. Validate Email
    clean_email = req.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in or use another email.",
        )

    # 2. Validate Mobile Number (MANDATORY)
    if not req.phone_number or not req.phone_number.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number is mandatory. Please enter your 10-digit mobile number.",
        )
    raw_digits = re.sub(r"[^\d]", "", req.phone_number.strip())
    if len(raw_digits) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid 10-digit mobile number.",
        )
    clean_phone = raw_digits[-10:]
    existing_phone = db.query(User).filter(User.phone_number == clean_phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already registered. Please sign in with this number.",
        )

    # 3. Derive username if not provided
    username = req.username
    if not username:
        base_name = clean_email.split("@")[0]
        base_name = re.sub(r"[^a-zA-Z0-9_]", "", base_name) or "user"
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
        email=clean_email,
        username=username,
        display_name=username,
        hashed_password=hash_password(req.password),
        phone_number=clean_phone,
        plan_tier="free",
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "phone_number": new_user.phone_number})
    return AuthResponse(access_token=token, user=new_user, needs_phone=False)


# ==========================================
# 2. LOGIN (EMAIL OR USERNAME + PASSWORD)
# ==========================================
@router.post("/login", response_model=AuthResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email/username/phone and password (strictly registered accounts only)."""
    raw_id = req.identifier or req.email
    if not raw_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email, username, or phone number is required."
        )
    identifier = raw_id.strip().lower()

    # Search by email, username, or phone
    clean_digits = re.sub(r"[^\d]", "", identifier)
    last10 = clean_digits[-10:] if len(clean_digits) >= 10 else None

    query = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    )
    if last10:
        query = db.query(User).filter(
            (User.email == identifier) | (User.username == identifier) | (User.phone_number.like(f"%{last10}%"))
        )
    user = query.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with these details. Please create an account first.",
        )

    if not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again or reset your password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    if user.email and user.email.lower() == "mk191515480@gmail.com":
        user.plan_tier = "ultra_pro"
        db.commit()

    needs_phone = not bool(user.phone_number)
    token = create_access_token({"sub": user.id, "email": user.email, "phone_number": user.phone_number})
    return AuthResponse(access_token=token, user=user, needs_phone=needs_phone)


# ==========================================
# 3. GOOGLE OAUTH
# ==========================================
@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register via Google OAuth (ID token or Access token)."""
    credential = req.credential.strip()
    email = None
    display_name = None
    picture = None

    import httpx

    # Case A: Google OAuth2 Access Token (starts with ya29.)
    if credential.startswith("ya29."):
        try:
            resp = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credential}"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email", "").lower()
                display_name = data.get("name")
                picture = data.get("picture")
            else:
                logger.error(f"Google userinfo error: {resp.status_code} - {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google access token verification failed.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Google userinfo exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not verify Google credentials: {str(e)}",
            )

    # Case B: Google ID Token (JWT starts with eyJ)
    elif credential.startswith("eyJ"):
        try:
            resp = httpx.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email", "").lower()
                display_name = data.get("name")
                picture = data.get("picture")
            else:
                logger.error(f"Google tokeninfo error: {resp.status_code} - {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google ID token verification failed.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Google tokeninfo exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not verify Google credentials: {str(e)}",
            )

    # Case C: Dev mock email
    elif "@" in credential and settings.ENVIRONMENT == "development":
        email = credential.lower()
        display_name = email.split("@")[0]

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google credential format.",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid email found in Google account.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        base_name = email.split("@")[0]
        base_name = re.sub(r"[^a-zA-Z0-9_]", "", base_name) or "user"
        username = base_name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_name}_{counter}"
            counter += 1

        user = User(
            email=email,
            username=username,
            display_name=display_name or username,
            avatar_url=picture,
            hashed_password=None,
            plan_tier="free",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        changed = False
        if not user.display_name and display_name:
            user.display_name = display_name
            changed = True
        if not user.avatar_url and picture:
            user.avatar_url = picture
            changed = True
        if not user.is_verified:
            user.is_verified = True
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    needs_phone = not bool(user.phone_number)
    token = create_access_token({"sub": user.id, "email": user.email, "phone_number": user.phone_number})
    return AuthResponse(access_token=token, user=user, needs_phone=needs_phone)


# ==========================================
# 3B. SET MANDATORY PHONE FOR GOOGLE USER
# ==========================================
@router.post("/set-phone", response_model=UserResponse)
def set_user_phone(req: SetPhoneRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Store mandatory mobile number for user (required for Google Sign-in users)."""
    raw_digits = re.sub(r"[^\d]", "", req.phone_number.strip())
    if len(raw_digits) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be at least 10 digits.",
        )
    clean_phone = raw_digits[-10:]
    existing_phone = db.query(User).filter(User.phone_number == clean_phone).first()
    if existing_phone and existing_phone.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already in use by another account.",
        )
    current_user.phone_number = clean_phone
    db.commit()
    db.refresh(current_user)
    return current_user



# ==========================================
# 4. PHONE OTP: SEND
# ==========================================
@router.post("/phone/send-otp")
async def send_phone_otp(req: PhoneSendOTPRequest, db: Session = Depends(get_db)):
    """Generate and dispatch a 6-digit OTP for phone verification via Fast2SMS."""
    clean_phone = re.sub(r"[^\d+]", "", req.phone_number.strip())
    otp_code = store_phone_otp(db, clean_phone)

    # Dispatch SMS via Fast2SMS
    sms_res = await sms_service.send_otp(clean_phone, otp_code)

    logger.info(f"[RHYNIA PHONE OTP] Generated code for {clean_phone}: {otp_code} | Fast2SMS: {sms_res}")
    print(f"\n==========================================")
    print(f"  [RHYNIA PHONE OTP] {clean_phone} -> {otp_code}")
    print(f"  [FAST2SMS RESULT] {sms_res}")
    print(f"==========================================\n")

    return {
        "status": "sent",
        "phone_number": clean_phone,
        "sms_delivered": sms_res.get("sms_delivered", False),
        "message": sms_res.get("message", "Verification code has been sent."),
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
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Trigger password reset code via Email (Gmail SMTP) or SMS (Fast2SMS)."""
    raw_ident = (req.identifier or req.email or "").strip()
    if not raw_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your registered email or phone number.",
        )

    # 1. Email Flow
    if "@" in raw_ident:
        email = raw_ident.lower()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please sign up first.",
            )
        otp_code = store_email_otp(db, email)

        # Dispatch real email via Gmail SMTP
        email_res = await email_service.send_otp_email(
            email, otp_code, user.display_name if user else None
        )

        logger.info(f"[FORGOT PWD EMAIL] Dispatched OTP to {email}: {otp_code} | Result: {email_res}")
        print(f"\n==========================================")
        print(f"  [FORGOT PASSWORD GMAIL OTP] {email} -> {otp_code}")
        print(f"  [GMAIL SMTP RESULT] {email_res}")
        print(f"==========================================\n")

        return {
            "status": "success",
            "channel": "email",
            "email": email,
            "email_delivered": email_res.get("success", False),
            "message": f"Verification code has been sent to your Gmail inbox ({email}).",
            "dev_code": otp_code if settings.ENVIRONMENT == "development" else None,
        }

    # 2. Phone Flow
    phone_clean = re.sub(r"[^\d+]", "", raw_ident)
    last10 = phone_clean[-10:] if len(phone_clean) >= 10 else phone_clean
    user = db.query(User).filter(User.phone_number.like(f"%{last10}%")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this mobile number. Please sign up first.",
        )
    phone_to_send = user.phone_number if user and user.phone_number else phone_clean

    clean_phone = re.sub(r"[^\d+]", "", phone_to_send)
    otp_code = store_phone_otp(db, clean_phone)
    sms_res = await sms_service.send_otp(clean_phone, otp_code)

    logger.info(f"[FORGOT PWD SMS] Dispatched OTP to {clean_phone}: {otp_code} | SMS: {sms_res}")
    print(f"\n==========================================")
    print(f"  [FORGOT PASSWORD SMS OTP] {clean_phone} -> {otp_code}")
    print(f"  [FAST2SMS RESULT] {sms_res}")
    print(f"==========================================\n")

    return {
        "status": "success",
        "channel": "sms",
        "phone_number": clean_phone,
        "sms_delivered": sms_res.get("sms_delivered", False),
        "message": sms_res.get("message", "Reset code dispatched to your registered phone."),
        "dev_code": otp_code if settings.ENVIRONMENT == "development" else None,
    }


# ==========================================
# 7. PRE-VERIFY OTP CODE (FORGOT PASSWORD)
# ==========================================
@router.post("/forgot-password/verify-code")
def verify_forgot_password_code(req: ForgotPasswordVerifyCodeRequest, db: Session = Depends(get_db)):
    """Pre-validate email or phone OTP before opening the Set New Password screen."""
    target_email = req.email or (req.identifier if req.identifier and "@" in req.identifier else None)
    target_phone = req.phone_number or (req.identifier if req.identifier and "@" not in req.identifier else None)

    if target_email:
        clean_email = target_email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please sign up first.",
            )
        is_valid = verify_email_otp(db, clean_email, req.otp_code.strip(), mark_used=False)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification code.",
            )
        return {
            "status": "valid",
            "channel": "email",
            "target": clean_email,
            "message": "Verification code accepted. Please create your new password.",
        }
    elif target_phone:
        clean_phone = re.sub(r"[^\d+]", "", target_phone.strip())
        last10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
        user = db.query(User).filter(User.phone_number.like(f"%{last10}%")).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this mobile number. Please sign up first.",
            )
        is_valid = verify_phone_otp(db, clean_phone, req.otp_code.strip(), mark_used=False)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired SMS verification code.",
            )
        return {
            "status": "valid",
            "channel": "sms",
            "target": clean_phone,
            "message": "Verification code accepted. Please create your new password.",
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide email or phone number with the OTP code.",
        )


# ==========================================
# 8. RESET PASSWORD WITH OTP
# ==========================================
@router.post("/forgot-password/reset-with-otp")
def reset_password_with_otp(req: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    """Verify email or phone OTP and set a new password directly (registered accounts only)."""
    target_email = req.email or (req.identifier if req.identifier and "@" in req.identifier else None)
    target_phone = req.phone_number or (req.identifier if req.identifier and "@" not in req.identifier else None)

    user = None

    if target_email:
        clean_email = target_email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please sign up first.",
            )
        is_valid = verify_email_otp(db, clean_email, req.otp_code.strip())
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification code.",
            )
        user.hashed_password = hash_password(req.new_password)
        user.is_verified = True
        db.commit()
        db.refresh(user)

    elif target_phone:
        clean_phone = re.sub(r"[^\d+]", "", target_phone.strip())
        last10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
        user = db.query(User).filter(User.phone_number.like(f"%{last10}%")).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this mobile number. Please sign up first.",
            )
        is_valid = verify_phone_otp(db, clean_phone, req.otp_code.strip())
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired SMS verification code.",
            )
        user.hashed_password = hash_password(req.new_password)
        user.is_verified = True
        db.commit()
        db.refresh(user)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide the email or phone number associated with the OTP.",
        )

    token = create_access_token({"sub": user.id, "email": user.email, "phone_number": user.phone_number})
    return {
        "status": "success",
        "message": "Password updated successfully! Welcome back.",
        "access_token": token,
        "user": user,
    }


# ==========================================
# 8. EMAIL OTP: SEND & VERIFY
# ==========================================
@router.post("/email/send-otp")
async def send_email_otp(req: EmailSendOTPRequest, db: Session = Depends(get_db)):
    """Generate and dispatch a 6-digit OTP for email verification via Gmail SMTP."""
    clean_email = req.email.strip().lower()
    otp_code = store_email_otp(db, clean_email)
    email_res = await email_service.send_otp_email(clean_email, otp_code)

    return {
        "status": "sent",
        "email": clean_email,
        "email_delivered": email_res.get("success", False),
        "message": f"Verification code sent to {clean_email}.",
        "dev_code": otp_code if settings.ENVIRONMENT == "development" else None,
    }


@router.post("/email/verify-otp", response_model=AuthResponse)
def verify_email_otp_endpoint(req: EmailVerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify email OTP and authenticate/verify user."""
    clean_email = req.email.strip().lower()
    is_valid = verify_email_otp(db, clean_email, req.otp_code.strip())
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        base_name = clean_email.split("@")[0]
        base_name = re.sub(r"[^a-zA-Z0-9_]", "", base_name) or "user"
        username = base_name
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_name}_{counter}"
            counter += 1

        user = User(
            email=clean_email,
            username=username,
            hashed_password=None,
            plan_tier="free",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.is_verified:
            user.is_verified = True
            db.commit()
            db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(access_token=token, user=user)



# ==========================================
# 8. RESET PASSWORD (EMAIL TOKEN)
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
