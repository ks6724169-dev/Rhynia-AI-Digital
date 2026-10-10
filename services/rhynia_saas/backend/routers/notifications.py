"""
Rhynia Intelligence SaaS — User Notification Preferences API
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.database import User, UserNotificationPreference, get_db, get_utc_now

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class NotificationSettingsResponse(BaseModel):
    enabled_all: bool
    task_complete: bool
    product_updates: bool
    push_notifications: bool
    email_notifications: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationSettingsUpdateRequest(BaseModel):
    enabled_all: Optional[bool] = None
    task_complete: Optional[bool] = None
    product_updates: Optional[bool] = None
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None


# Helper to get or create preferences for a user
def get_or_create_preferences(user: User, db: Session) -> UserNotificationPreference:
    pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == user.id).first()
    if not pref:
        pref = UserNotificationPreference(
            user_id=user.id,
            enabled_all=True,
            task_complete=True,
            product_updates=True,
            push_notifications=True,
            email_notifications=False,
            updated_at=get_utc_now(),
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


# ==========================================
# 1. GET NOTIFICATION PREFERENCES
# ==========================================
@router.get("/settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve current user's notification preferences."""
    pref = get_or_create_preferences(current_user, db)
    return pref


# ==========================================
# 2. UPDATE NOTIFICATION PREFERENCES
# ==========================================
@router.patch("/settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    req: NotificationSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update notification preferences (Master switch, alert types, channels)."""
    pref = get_or_create_preferences(current_user, db)

    if req.enabled_all is not None:
        pref.enabled_all = req.enabled_all

    if req.task_complete is not None:
        pref.task_complete = req.task_complete

    if req.product_updates is not None:
        pref.product_updates = req.product_updates

    if req.push_notifications is not None:
        pref.push_notifications = req.push_notifications

    if req.email_notifications is not None:
        pref.email_notifications = req.email_notifications

    pref.updated_at = get_utc_now()
    db.commit()
    db.refresh(pref)

    return pref
