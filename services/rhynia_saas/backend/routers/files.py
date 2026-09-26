"""
Rhynia Intelligence SaaS — File Attachment & Storage Management API
"""

import os
import re
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import decode_access_token, get_current_user
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import User, UserFile, get_db

router = APIRouter(prefix="/api/v1/files", tags=["Files"])

# Allowed MIME Types
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class FileResponseSchema(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    created_at: str

    class Config:
        from_attributes = True


class FileUploadSuccessResponse(BaseModel):
    file: FileResponseSchema
    storage_used_bytes: int
    storage_quota_bytes: int
    storage_used_percentage: float


# ==========================================
# 1. UPLOAD FILE WITH QUOTA CHECK
# ==========================================
@router.post("/upload", response_model=FileUploadSuccessResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a document or image with strict MIME verification and plan storage quota checks.
    Enforces Free Tier 500 MB / Pro 5 GB / Ultra Pro 25 GB limit (HTTP 413 on exceed).
    """
    # 1. Verify MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File type '{content_type}' is not supported. "
                "Allowed formats: PNG, JPEG, WebP, PDF, DOCX, TXT, MD."
            ),
        )

    # 2. Read file content and determine size
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file.",
        )

    # 3. Determine user storage quota
    if current_user.plan_tier == "ultra_pro":
        quota_bytes = settings.ULTRA_PRO_STORAGE_BYTES
    elif current_user.plan_tier == "pro":
        quota_bytes = settings.PRO_TIER_STORAGE_BYTES
    else:
        quota_bytes = settings.FREE_TIER_STORAGE_BYTES

    # 4. Enforce Quota Limit (HTTP 413)
    if current_user.storage_used_bytes + file_size > quota_bytes:
        max_mb = quota_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=(
                f"Storage quota exceeded. Your {current_user.plan_tier.upper()} plan limit is {max_mb} MB. "
                "Please delete older files or upgrade your plan to continue."
            ),
        )

    # 5. For image files, perform server-side normalization & EXIF orientation fix
    if content_type in ["image/jpeg", "image/png", "image/webp"]:
        try:
            from io import BytesIO
            from PIL import Image, ImageOps
            img = Image.open(BytesIO(file_bytes))
            img = ImageOps.exif_transpose(img)

            # Bound maximum dimensions to 2048px for sharp detail without bloat
            max_dim = 2048
            if img.width > max_dim or img.height > max_dim:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            out_buf = BytesIO()
            if content_type == "image/jpeg":
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.save(out_buf, format="JPEG", quality=88, optimize=True)
            elif content_type == "image/webp":
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGB")
                img.save(out_buf, format="WEBP", quality=88)
            elif content_type == "image/png":
                img.save(out_buf, format="PNG", optimize=True)

            opt_bytes = out_buf.getvalue()
            if len(opt_bytes) < len(file_bytes) or (img.width > max_dim or img.height > max_dim):
                file_bytes = opt_bytes
                file_size = len(file_bytes)
        except Exception:
            pass

    # 6. Sanitize filename and prepare user upload directory
    user_upload_dir = settings.UPLOAD_DIR / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    clean_name = re.sub(r"[^\w\-_\.]", "_", file.filename or "attachment")
    unique_prefix = uuid.uuid4().hex[:8]
    stored_name = f"{unique_prefix}_{clean_name}"
    disk_path = user_upload_dir / stored_name

    # 7. Save file to disk
    with open(disk_path, "wb") as f:
        f.write(file_bytes)

    # 7. Record in Database & Update User Storage
    user_file = UserFile(
        user_id=current_user.id,
        original_filename=file.filename or clean_name,
        stored_filename=stored_name,
        file_path=str(disk_path),
        file_size_bytes=file_size,
        mime_type=content_type,
    )
    db.add(user_file)
    current_user.storage_used_bytes += file_size
    db.commit()
    db.refresh(user_file)

    used_pct = round((current_user.storage_used_bytes / quota_bytes) * 100, 2)
    return FileUploadSuccessResponse(
        file=FileResponseSchema(
            id=user_file.id,
            original_filename=user_file.original_filename,
            file_size_bytes=user_file.file_size_bytes,
            mime_type=user_file.mime_type,
            created_at=user_file.created_at.isoformat(),
        ),
        storage_used_bytes=current_user.storage_used_bytes,
        storage_quota_bytes=quota_bytes,
        storage_used_percentage=used_pct,
    )


# ==========================================
# 2. LIST USER FILES
# ==========================================
@router.get("", response_model=List[FileResponseSchema])
def list_files(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all uploaded files for the current user."""
    files = (
        db.query(UserFile)
        .filter(UserFile.user_id == current_user.id)
        .order_by(UserFile.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        FileResponseSchema(
            id=f.id,
            original_filename=f.original_filename,
            file_size_bytes=f.file_size_bytes,
            mime_type=f.mime_type,
            created_at=f.created_at.isoformat(),
        )
        for f in files
    ]


# ==========================================
# 3. DOWNLOAD FILE / PREVIEW
# ==========================================
@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
):
    """Download an uploaded file with query token or Bearer ownership verification."""
    user_file = db.query(UserFile).filter(UserFile.id == file_id).first()
    if not user_file or not os.path.exists(user_file.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    # Verify authorization if provided
    auth_token = (credentials.credentials if credentials else None) or token
    if auth_token:
        payload = decode_access_token(auth_token)
        if payload and payload.get("sub") == user_file.user_id:
            return FileResponse(
                path=user_file.file_path,
                media_type=user_file.mime_type,
                filename=user_file.original_filename,
            )

    # Allow direct image thumbnail streaming for preview
    if user_file.mime_type.startswith("image/"):
        return FileResponse(
            path=user_file.file_path,
            media_type=user_file.mime_type,
            filename=user_file.original_filename,
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required to download this file.",
    )


# ==========================================
# 4. DELETE FILE & RECLAIM QUOTA
# ==========================================
@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an uploaded file from disk and database, and reclaim storage quota."""
    user_file = (
        db.query(UserFile)
        .filter(UserFile.id == file_id, UserFile.user_id == current_user.id)
        .first()
    )
    if not user_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    # Remove from disk if exists
    if os.path.exists(user_file.file_path):
        try:
            os.remove(user_file.file_path)
        except OSError:
            pass

    # Decrement storage quota
    freed_bytes = user_file.file_size_bytes
    current_user.storage_used_bytes = max(0, current_user.storage_used_bytes - freed_bytes)

    db.delete(user_file)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
