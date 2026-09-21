-- ==============================================================================
-- RHYNIA INTELLIGENCE SAAS v1.0 — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================
-- Description: Complete production schema with 5 core tables, foreign keys,
--              indexes, and cascade deletion rules.
-- Target DB:   PostgreSQL 15+ (Supabase Cloud)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE,
    plan_tier VARCHAR(20) NOT NULL DEFAULT 'free',
    daily_messages_used INTEGER NOT NULL DEFAULT 0,
    last_active_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS ix_users_plan_tier ON users(plan_tier);

-- ==============================================================================
-- 2. PHONE OTPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS phone_otps (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_phone_otps_phone_number ON phone_otps(phone_number);
CREATE INDEX IF NOT EXISTS ix_phone_otps_lookup ON phone_otps(phone_number, is_used);

-- ==============================================================================
-- 3. CHAT SESSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ==============================================================================
-- 4. CHAT MESSAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    model_used VARCHAR(100),
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS ix_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS ix_chat_messages_created_at ON chat_messages(created_at ASC);

-- ==============================================================================
-- 5. USER FILES ATTACHMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_files (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS ix_user_files_created_at ON user_files(created_at DESC);

-- ==============================================================================
-- SCHEMA COMMENTS & METADATA
-- ==============================================================================
COMMENT ON TABLE users IS 'Registered Rhynia Platform Users';
COMMENT ON TABLE phone_otps IS 'Temporary 4-digit verification codes';
COMMENT ON TABLE chat_sessions IS 'Conversation threads per user';
COMMENT ON TABLE chat_messages IS 'Individual message exchanges within sessions';
COMMENT ON TABLE user_files IS 'User uploaded documents, images, and attachments';
