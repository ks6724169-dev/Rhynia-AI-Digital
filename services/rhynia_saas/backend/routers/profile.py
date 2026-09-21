"""
Rhynia Intelligence SaaS — User Profile & Preferences Management API
"""

import os
import re
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import User, get_db

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

ALLOWED_AVATAR_MIMES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    theme: Optional[str] = Field(None, max_length=20)  # dark, light
    accent_color: Optional[str] = Field(None, max_length=20)  # hex color code


class StorageMetricsResponse(BaseModel):
    storage_used_bytes: int
    storage_quota_bytes: int
    storage_used_mb: float
    storage_quota_mb: float
    storage_free_mb: float
    storage_used_percentage: float
    plan_tier: str


class ProfileResponse(BaseModel):
    id: str
    email: Optional[str]
    username: str
    display_name: Optional[str]
    phone_number: Optional[str]
    avatar_url: Optional[str]
    theme: str
    accent_color: str
    plan_tier: str
    daily_messages_used: int
    storage: StorageMetricsResponse
    is_verified: bool

    class Config:
        from_attributes = True


# ==========================================
# 1. GET FULL USER PROFILE
# ==========================================
@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve current user profile, preferences, and storage metrics."""
    if current_user.plan_tier == "ultra_pro":
        quota_bytes = settings.ULTRA_PRO_STORAGE_BYTES
    elif current_user.plan_tier == "pro":
        quota_bytes = settings.PRO_TIER_STORAGE_BYTES
    else:
        quota_bytes = settings.FREE_TIER_STORAGE_BYTES

    used_mb = round(current_user.storage_used_bytes / (1024 * 1024), 2)
    quota_mb = round(quota_bytes / (1024 * 1024), 2)
    free_mb = max(0.0, round(quota_mb - used_mb, 2))
    used_pct = round((current_user.storage_used_bytes / quota_bytes) * 100, 2)

    storage_info = StorageMetricsResponse(
        storage_used_bytes=current_user.storage_used_bytes,
        storage_quota_bytes=quota_bytes,
        storage_used_mb=used_mb,
        storage_quota_mb=quota_mb,
        storage_free_mb=free_mb,
        storage_used_percentage=used_pct,
        plan_tier=current_user.plan_tier,
    )

    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        display_name=current_user.display_name or current_user.username,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        theme=current_user.theme or "dark",
        accent_color=current_user.accent_color or "#0078D4",
        plan_tier=current_user.plan_tier,
        daily_messages_used=current_user.daily_messages_used,
        storage=storage_info,
        is_verified=current_user.is_verified,
    )


# ==========================================
# 2. UPDATE PROFILE & PREFERENCES
# ==========================================
@router.patch("", response_model=ProfileResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile details (Name, Username, Theme, Accent Color)."""
    if req.username and req.username.lower() != current_user.username.lower():
        clean_user = re.sub(r"[^a-zA-Z0-9_]", "", req.username.strip())
        if not clean_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must contain alphanumeric characters.",
            )
        existing = db.query(User).filter(User.username == clean_user).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already in use.",
            )
        current_user.username = clean_user

    if req.display_name is not None:
        current_user.display_name = req.display_name.strip()

    if req.theme and req.theme.lower() in ["dark", "light"]:
        current_user.theme = req.theme.lower()

    if req.accent_color:
        clean_color = req.accent_color.strip()
        if re.match(r"^#(?:[0-9a-fA-F]{3}){1,2}$", clean_color):
            current_user.accent_color = clean_color

    db.commit()
    db.refresh(current_user)
    return get_profile(current_user=current_user)


# ==========================================
# 3. UPLOAD AVATAR PHOTO
# ==========================================
@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a profile avatar image (max 5 MB, JPEG/PNG/WebP)."""
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_AVATAR_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPEG, PNG, or WebP image.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Avatar image size must not exceed 5 MB.",
        )

    # Save to user directory
    user_dir = settings.UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"

    avatar_filename = f"avatar_{uuid.uuid4().hex[:8]}.{ext}"
    avatar_path = user_dir / avatar_filename

    with open(avatar_path, "wb") as f:
        f.write(file_bytes)

    # Update user avatar URL
    current_user.avatar_url = f"/api/v1/profile/avatar/view"
    db.commit()

    return {
        "status": "success",
        "message": "Avatar photo updated successfully.",
        "avatar_url": current_user.avatar_url,
    }


# ==========================================
# 4. VIEW CURRENT AVATAR
# ==========================================
@router.get("/avatar/view")
def view_avatar(
    current_user: User = Depends(get_current_user),
):
    """Serve the authenticated user's uploaded avatar image."""
    user_dir = settings.UPLOAD_DIR / str(current_user.id)
    if not user_dir.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar found.")

    avatars = list(user_dir.glob("avatar_*"))
    if not avatars:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar found.")

    latest_avatar = max(avatars, key=os.path.getctime)
    return FileResponse(path=latest_avatar)


# ==========================================
# 5. STORAGE METRICS BREAKDOWN
# ==========================================
@router.get("/storage", response_model=StorageMetricsResponse)
def get_storage_breakdown(current_user: User = Depends(get_current_user)):
    """Retrieve detailed storage breakdown for Settings Progress Bar."""
    if current_user.plan_tier == "ultra_pro":
        quota_bytes = settings.ULTRA_PRO_STORAGE_BYTES
    elif current_user.plan_tier == "pro":
        quota_bytes = settings.PRO_TIER_STORAGE_BYTES
    else:
        quota_bytes = settings.FREE_TIER_STORAGE_BYTES

    used_mb = round(current_user.storage_used_bytes / (1024 * 1024), 2)
    quota_mb = round(quota_bytes / (1024 * 1024), 2)
    free_mb = max(0.0, round(quota_mb - used_mb, 2))
    used_pct = round((current_user.storage_used_bytes / quota_bytes) * 100, 2)

    return StorageMetricsResponse(
        storage_used_bytes=current_user.storage_used_bytes,
        storage_quota_bytes=quota_bytes,
        storage_used_mb=used_mb,
        storage_quota_mb=quota_mb,
        storage_free_mb=free_mb,
        storage_used_percentage=used_pct,
        plan_tier=current_user.plan_tier,
    )
