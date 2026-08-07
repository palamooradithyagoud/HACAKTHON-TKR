-- ====================================================================
-- SKILLSCATALYST - MIGRATION 003: MESSAGING SYSTEM IN SUPABASE POSTGRESQL
-- ====================================================================
-- Relational messaging system: conversations and messages tables.
-- Run this in Supabase SQL Editor ONCE.
-- ====================================================================

-- ── 1. CONVERSATIONS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
    id                    BIGSERIAL PRIMARY KEY,
    student_id            TEXT NOT NULL,
    faculty_id            TEXT NOT NULL,
    last_message          TEXT DEFAULT '',
    last_message_time     TIMESTAMPTZ DEFAULT NOW(),
    unread_student_count  INTEGER DEFAULT 0,
    unread_faculty_count  INTEGER DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_faculty UNIQUE (student_id, faculty_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_student ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_faculty ON public.conversations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

-- ── 2. MESSAGES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL,
    sender_type     TEXT NOT NULL CHECK (sender_type IN ('student', 'faculty')),
    receiver_id     TEXT NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    edited_at       TIMESTAMPTZ,
    deleted         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- ── 3. RLS POLICIES & PERMISSIONS ──────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on conversations" ON public.conversations;
CREATE POLICY "Service role full access on conversations"
    ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon/auth access on conversations" ON public.conversations;
CREATE POLICY "Anon/auth access on conversations"
    ON public.conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO service_role, anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on messages" ON public.messages;
CREATE POLICY "Service role full access on messages"
    ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon/auth access on messages" ON public.messages;
CREATE POLICY "Anon/auth access on messages"
    ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO service_role, anon, authenticated;
