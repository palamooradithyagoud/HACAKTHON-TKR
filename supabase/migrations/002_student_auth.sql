-- ====================================================================
-- SKILLSCATALYST - MIGRATION 002: STUDENT ROLL-NUMBER AUTH SYSTEM
-- ====================================================================
-- Adds standalone students table and faculty_users table.
-- Alters existing feature tables to use TEXT user_id (roll_number)
-- instead of UUID FK to auth.users, so the system works without
-- Supabase Auth entirely.
-- Run this in Supabase SQL Editor ONCE.
-- ====================================================================

-- ── 0. TRIGGER FUNCTION FOR UPDATED_AT ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. STUDENTS TABLE (Master source of truth) ────────────────────
CREATE TABLE IF NOT EXISTS public.students (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number       TEXT UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    full_name         TEXT DEFAULT '',
    email             TEXT DEFAULT '',
    department        TEXT DEFAULT '',
    branch            TEXT DEFAULT '',
    section           TEXT DEFAULT '',
    year              TEXT DEFAULT '',
    semester          TEXT DEFAULT '',
    college           TEXT DEFAULT 'TKR College of Engineering & Technology',
    attendance        NUMERIC(5,2) DEFAULT 0,
    leetcode_solved   INTEGER DEFAULT 0,
    gfg_solved        INTEGER DEFAULT 0,
    codechef_solved   INTEGER DEFAULT 0,
    hackerrank_score  INTEGER DEFAULT 0,
    codeforces_solved INTEGER DEFAULT 0,
    github_repos      INTEGER DEFAULT 0,
    github_commits    INTEGER DEFAULT 0,
    coding_score      INTEGER DEFAULT 0,
    target_role       TEXT DEFAULT 'Software Engineer',
    github_username   TEXT DEFAULT '',
    leetcode_username TEXT DEFAULT '',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department);

-- ── 2. FACULTY USERS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faculty_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT DEFAULT '',
    department    TEXT DEFAULT '',
    college       TEXT DEFAULT 'TKR College of Engineering & Technology',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_email ON public.faculty_users(email);

-- ── 3. UPDATED_AT TRIGGERS ────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at_students ON public.students;
CREATE TRIGGER trg_set_updated_at_students
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_faculty ON public.faculty_users;
CREATE TRIGGER trg_set_updated_at_faculty
    BEFORE UPDATE ON public.faculty_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. RLS POLICIES ───────────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_users ENABLE ROW LEVEL SECURITY;

-- Service role access
DROP POLICY IF EXISTS "Service role full access on students" ON public.students;
CREATE POLICY "Service role full access on students"
    ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow public read access if service role key or anon key is used
DROP POLICY IF EXISTS "Anon select on students" ON public.students;
CREATE POLICY "Anon select on students"
    ON public.students FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO service_role, anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on faculty_users" ON public.faculty_users;
CREATE POLICY "Service role full access on faculty_users"
    ON public.faculty_users FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_users TO service_role, anon, authenticated;

-- ── 5. ALTER user_academic_profile: drop FK to auth.users ─────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='user_academic_profile'
        AND constraint_type='FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE public.user_academic_profile
            DROP CONSTRAINT IF EXISTS user_academic_profile_user_id_fkey;
    END IF;
END $$;

ALTER TABLE public.user_academic_profile
    ADD COLUMN IF NOT EXISTS roll_number TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coding_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS roll_number_key TEXT DEFAULT '';

-- ── 6. ALTER user_coding_profiles: drop FK to auth.users ─────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='user_coding_profiles'
        AND constraint_type='FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE public.user_coding_profiles
            DROP CONSTRAINT IF EXISTS user_coding_profiles_user_id_fkey;
    END IF;
END $$;

-- ── 7. Ensure permissions for feature tables ─────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_academic_profile TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_coding_profiles TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_playlists TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO service_role, anon, authenticated;

-- Done.
