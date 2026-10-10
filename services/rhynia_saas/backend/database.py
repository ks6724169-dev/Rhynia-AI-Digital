"""
Rhynia Intelligence SaaS — Database Models & Connection Engine
"""

import uuid
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

from services.rhynia_saas.backend.config import settings

# Database Engine Configuration
import os
db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Ensure database folder exists
    import re
    from pathlib import Path
    db_match = re.search(r"sqlite:///(.*)", db_url)
    if db_match:
        db_path = Path(db_match.group(1))
        if db_path.parent and not db_path.parent.exists():
            db_path.parent.mkdir(parents=True, exist_ok=True)
else:
    connect_args = {"connect_timeout": 15, "sslmode": "require"}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def generate_uuid() -> str:
    """Generate a clean UUID string."""
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


# ==========================================
# 1. USER MODEL
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    phone_number = Column(String(20), unique=True, index=True, nullable=True)

    # Subscription & Quota Limits
    plan_tier = Column(String(20), default="free", nullable=False)  # free, pro, ultra_pro
    daily_messages_used = Column(Integer, default=0, nullable=False)
    last_active_date = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    storage_used_bytes = Column(BigInteger, default=0, nullable=False)

    # Profile & Preferences (Settings Screens 05/06)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    theme = Column(String(20), default="dark", nullable=False)
    accent_color = Column(String(20), default="#0078D4", nullable=False)

    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    files = relationship("UserFile", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("MessageFeedback", back_populates="user", cascade="all, delete-orphan")
    notification_preferences = relationship(
        "UserNotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    memory_facts = relationship("UserMemoryFact", back_populates="user", cascade="all, delete-orphan")
    summary_buffers = relationship("ChatSummaryBuffer", back_populates="user", cascade="all, delete-orphan")


# ==========================================
# 2. PHONE / EMAIL OTP VERIFICATION
# ==========================================
class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    __table_args__ = (Index("ix_phone_otps_lookup", "phone_number", "is_used"),)


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    __table_args__ = (Index("ix_email_otps_lookup", "email", "is_used"),)



# ==========================================
# 3. CHAT SESSION MODEL
# ==========================================
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="New Chat", nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )
    summary_buffer = relationship(
        "ChatSummaryBuffer",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ==========================================
# 4. CHAT MESSAGE MODEL
# ==========================================
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role = Column(String(20), nullable=False)  # user, model, system
    content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)
    token_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User", back_populates="messages")


# ==========================================
# 5. USER FILE ATTACHMENT MODEL
# ==========================================
class UserFile(Base):
    __tablename__ = "user_files"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="files")


# ==========================================
# 6. MESSAGE FEEDBACK MODEL (Like / Dislike)
# ==========================================
class MessageFeedback(Base):
    __tablename__ = "message_feedbacks"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id = Column(
        String(36), ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    message_id = Column(String(100), nullable=True, index=True)
    rating = Column(String(20), nullable=False)  # "like" or "dislike"
    tags = Column(Text, nullable=True)  # JSON-encoded array of selected tags
    comment = Column(Text, nullable=True)
    chat_snippet = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="feedbacks")


# ==========================================
# 7. USER NOTIFICATION PREFERENCES MODEL
# ==========================================
class UserNotificationPreference(Base):
    __tablename__ = "user_notification_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    enabled_all = Column(Boolean, default=True, nullable=False)
    task_complete = Column(Boolean, default=True, nullable=False)
    product_updates = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=False, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="notification_preferences")


# ==========================================
# 8. USER MEMORY FACT MODEL (Long-Term Personalization)
# ==========================================
class UserMemoryFact(Base):
    __tablename__ = "user_memory_facts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fact_key = Column(String(100), nullable=False, index=True)  # e.g., "profession", "language_pref", "interests"
    fact_value = Column(Text, nullable=False)
    category = Column(String(50), default="general", nullable=False)  # "profile", "preference", "context", "goal"
    confidence_score = Column(Integer, default=100, nullable=False)
    size_bytes = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="memory_facts")


# ==========================================
# 9. CHAT SUMMARY BUFFER MODEL (2-Tier Rolling Summarization)
# ==========================================
class ChatSummaryBuffer(Base):
    __tablename__ = "chat_summary_buffers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    macro_summary = Column(Text, default="", nullable=False)
    micro_summary = Column(Text, default="", nullable=False)
    message_count = Column(Integer, default=0, nullable=False)
    last_summarized_message_id = Column(String(36), nullable=True)
    size_bytes = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    session = relationship("ChatSession", back_populates="summary_buffer")
    user = relationship("User", back_populates="summary_buffers")


# ==========================================
# DATABASE HELPER FUNCTIONS
# ==========================================
def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables in the database safely without blocking startup."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.getLogger("rhynia.database").warning(f"init_db safe skip: {e}")
