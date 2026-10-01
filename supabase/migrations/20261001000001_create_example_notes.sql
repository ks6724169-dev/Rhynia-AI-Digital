-- Migration: 20261001000001_create_example_notes.sql
-- Description: Example table demonstrating automatic execution from GitHub to Supabase

CREATE TABLE IF NOT EXISTS public.rhynia_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
