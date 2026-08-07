-- ====================================================================
-- SKILLSCATALYST - MASTER AUTO-REPAIRING SUPABASE SQL SCHEMA
-- ====================================================================
-- Production-ready, fully idempotent SQL script for Supabase SQL Editor.
-- Fixes missing columns (company_slug, roll_number, etc.), alters old FKs,
-- and provisions all tables for Roll Number Student Auth & Faculty Auth.
-- Copy and paste this entire block into Supabase SQL Editor and click RUN.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 0. TRIGGER FUNCTION FOR UPDATED_AT ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. DROP OLD FK CONSTRAINTS POINTING TO auth.users ─────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'public'
          AND (constraint_name LIKE '%user_id%' OR constraint_name LIKE '%auth%')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE;';
    END LOOP;
END $$;

-- ── 2. STUDENTS TABLE ──────────────────────────────────────────────
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

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS roll_number TEXT,
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS attendance NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS leetcode_solved INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gfg_solved INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS codechef_solved INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hackerrank_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS codeforces_solved INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS github_repos INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS github_commits INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coding_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Software Engineer';

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department);

-- ── 3. FACULTY USERS TABLE ────────────────────────────────────────
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

-- ── 4. USER ACADEMIC PROFILE TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_academic_profile (
    user_id               TEXT PRIMARY KEY,
    roll_number           TEXT DEFAULT '',
    full_name             TEXT DEFAULT '',
    college               TEXT DEFAULT 'TKR College of Engineering & Technology',
    department            TEXT DEFAULT '',
    section               TEXT DEFAULT '',
    academic_year         TEXT DEFAULT '',
    target_role           TEXT DEFAULT '',
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    coding_score          INTEGER DEFAULT 0,
    roll_number_key       TEXT DEFAULT '',
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_academic_profile
    ADD COLUMN IF NOT EXISTS roll_number TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'TKR College of Engineering & Technology',
    ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS section TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coding_score INTEGER DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE public.user_academic_profile ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 5. USER CODING PROFILES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_coding_profiles (
    user_id           TEXT PRIMARY KEY,
    leetcode_url      TEXT DEFAULT '',
    github_url        TEXT DEFAULT '',
    hackerrank_url    TEXT DEFAULT '',
    codechef_url      TEXT DEFAULT '',
    geeksforgeeks_url TEXT DEFAULT '',
    codeforces_url    TEXT DEFAULT '',
    stats_json        JSONB DEFAULT '{}'::jsonb,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_coding_profiles
    ADD COLUMN IF NOT EXISTS leetcode_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS github_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS hackerrank_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS codechef_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS geeksforgeeks_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS codeforces_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS stats_json JSONB DEFAULT '{}'::jsonb;

DO $$ BEGIN
    ALTER TABLE public.user_coding_profiles ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 6. USER OVERALL PROGRESS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id                   TEXT PRIMARY KEY,
    problems_solved           INTEGER NOT NULL DEFAULT 0,
    success_rate              NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    streak_days               INTEGER NOT NULL DEFAULT 0,
    learning_progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    resume_readiness_score    NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    ai_career_health_score    NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_progress
    ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS learning_progress_percent NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS resume_readiness_score NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS ai_career_health_score NUMERIC(5, 2) DEFAULT 0.00;

DO $$ BEGIN
    ALTER TABLE public.user_progress ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 7. LEETCODE & COMPANY PRACTICE PROGRESS ────────────────────────
CREATE TABLE IF NOT EXISTS public.leetcode_progress (
    id             BIGSERIAL PRIMARY KEY,
    user_id        TEXT NOT NULL,
    company_slug   TEXT DEFAULT '',
    question_id    INTEGER DEFAULT 0,
    question_title TEXT DEFAULT '',
    difficulty     TEXT DEFAULT 'Easy',
    acceptance     TEXT DEFAULT '',
    frequency      TEXT DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'solved',
    solved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leetcode_progress
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS company_slug TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS question_id INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS question_title TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Easy',
    ADD COLUMN IF NOT EXISTS acceptance TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'solved',
    ADD COLUMN IF NOT EXISTS solved_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
    ALTER TABLE public.leetcode_progress ADD CONSTRAINT leetcode_progress_user_company_q_unique UNIQUE (user_id, company_slug, question_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_leetcode_user ON public.leetcode_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_company ON public.leetcode_progress(company_slug);

-- ── 8. ROADMAP PROGRESS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT NOT NULL,
    roadmap_id   TEXT NOT NULL,
    node_id      TEXT NOT NULL,
    node_title   TEXT NOT NULL,
    category     TEXT DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'completed',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roadmap_progress
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS roadmap_id TEXT,
    ADD COLUMN IF NOT EXISTS node_id TEXT,
    ADD COLUMN IF NOT EXISTS node_title TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
    ALTER TABLE public.roadmap_progress ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.roadmap_progress ADD CONSTRAINT roadmap_progress_user_roadmap_node_unique UNIQUE (user_id, roadmap_id, node_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_roadmap_user ON public.roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_id ON public.roadmap_progress(roadmap_id);

-- ── 8B. APTITUDE ATTEMPTS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aptitude_attempts (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               TEXT NOT NULL,
    topic_id              INTEGER DEFAULT 0,
    question_id           INTEGER DEFAULT 0,
    selected_option_index INTEGER DEFAULT 0,
    is_correct            BOOLEAN DEFAULT FALSE,
    time_taken_seconds    INTEGER DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.aptitude_attempts ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_aptitude_user ON public.aptitude_attempts(user_id);

-- ── 9. RESUME SCORES TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resume_scores (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 TEXT NOT NULL,
    filename                TEXT DEFAULT '',
    target_role             TEXT DEFAULT '',
    company_type            TEXT DEFAULT 'Product-Based',
    overall_score           NUMERIC(5, 2) DEFAULT 0,
    ats_compatibility_score NUMERIC(5, 2) DEFAULT 0,
    skills_match_score      NUMERIC(5, 2) DEFAULT 0,
    experience_score        NUMERIC(5, 2) DEFAULT 0,
    strengths               JSONB DEFAULT '[]'::jsonb,
    improvements            JSONB DEFAULT '[]'::jsonb,
    full_review_json        JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resume_scores
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS filename TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'Product-Based',
    ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ats_compatibility_score NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS skills_match_score NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS experience_score NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS improvements JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS full_review_json JSONB DEFAULT '{}'::jsonb;

DO $$ BEGIN
    ALTER TABLE public.resume_scores ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_resume_user ON public.resume_scores(user_id);

-- ── 10. SAVED PLAYLISTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_playlists (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT NOT NULL,
    playlist_id  TEXT NOT NULL,
    title        TEXT NOT NULL,
    channel      TEXT DEFAULT '',
    description  TEXT DEFAULT '',
    level        TEXT DEFAULT '',
    video_count  TEXT DEFAULT '',
    duration     TEXT DEFAULT '',
    playlist_url TEXT DEFAULT '',
    thumbnail    TEXT DEFAULT '',
    source       TEXT DEFAULT 'youtube',
    skill_query  TEXT DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_playlists
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS playlist_id TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS video_count TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS playlist_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS thumbnail TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'youtube',
    ADD COLUMN IF NOT EXISTS skill_query TEXT DEFAULT '';

DO $$ BEGIN
    ALTER TABLE public.saved_playlists ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_saved_playlists_user ON public.saved_playlists(user_id);

-- ── 11. VIDEO WATCH PROGRESS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_progress (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT NOT NULL,
    playlist_id  TEXT NOT NULL,
    video_id     TEXT NOT NULL,
    watched      BOOLEAN DEFAULT FALSE,
    last_position INTEGER DEFAULT 0,
    watch_time   INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.video_progress
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS playlist_id TEXT,
    ADD COLUMN IF NOT EXISTS video_id TEXT,
    ADD COLUMN IF NOT EXISTS watched BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_position INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS watch_time INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$ BEGIN
    ALTER TABLE public.video_progress ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_video_progress_user ON public.video_progress(user_id);

-- ── 12. LEARNING PROGRESS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      TEXT NOT NULL,
    user_id         TEXT,
    skill_name      TEXT NOT NULL,
    completed_steps JSONB DEFAULT '[]'::jsonb,
    completion_pct  NUMERIC(5,2) DEFAULT 0.00,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_progress
    ADD COLUMN IF NOT EXISTS session_id TEXT,
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS skill_name TEXT,
    ADD COLUMN IF NOT EXISTS completed_steps JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2) DEFAULT 0.00;

DO $$ BEGIN
    ALTER TABLE public.learning_progress ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_learning_progress_session ON public.learning_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_skill ON public.learning_progress(skill_name);

-- ── 13. SKILLS CACHE TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skills_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name      TEXT NOT NULL UNIQUE,
    roadmap_json    JSONB DEFAULT '{}'::jsonb,
    playlists_json  JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 14. TRUST SCORE ENGINE TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trust_score_engine (
    url             TEXT PRIMARY KEY,
    trust_score     NUMERIC(5,2) DEFAULT 50.00,
    clicks          INTEGER DEFAULT 0,
    saves           INTEGER DEFAULT 0,
    ignores         INTEGER DEFAULT 0,
    completions     INTEGER DEFAULT 0,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 15. USER FEEDBACK & ANALYTICS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,
    action          TEXT NOT NULL,
    resource_url    TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON public.user_feedback(user_id);

-- ── 16. AUTOMATIC UPDATED_AT TRIGGERS ─────────────────────────────
DROP TRIGGER IF EXISTS trg_set_updated_at_students ON public.students;
CREATE TRIGGER trg_set_updated_at_students
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_faculty ON public.faculty_users;
CREATE TRIGGER trg_set_updated_at_faculty
    BEFORE UPDATE ON public.faculty_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_academic ON public.user_academic_profile;
CREATE TRIGGER trg_set_updated_at_academic
    BEFORE UPDATE ON public.user_academic_profile
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_coding ON public.user_coding_profiles;
CREATE TRIGGER trg_set_updated_at_coding
    BEFORE UPDATE ON public.user_coding_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_progress ON public.user_progress;
CREATE TRIGGER trg_set_updated_at_progress
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 17. ROW LEVEL SECURITY & PERMISSIONS ───────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_academic_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leetcode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access on students" ON public.students;
CREATE POLICY "Full access on students" ON public.students FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on faculty_users" ON public.faculty_users;
CREATE POLICY "Full access on faculty_users" ON public.faculty_users FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on user_academic_profile" ON public.user_academic_profile;
CREATE POLICY "Full access on user_academic_profile" ON public.user_academic_profile FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on user_coding_profiles" ON public.user_coding_profiles;
CREATE POLICY "Full access on user_coding_profiles" ON public.user_coding_profiles FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on user_progress" ON public.user_progress;
CREATE POLICY "Full access on user_progress" ON public.user_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on leetcode_progress" ON public.leetcode_progress;
CREATE POLICY "Full access on leetcode_progress" ON public.leetcode_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on roadmap_progress" ON public.roadmap_progress;
CREATE POLICY "Full access on roadmap_progress" ON public.roadmap_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on aptitude_attempts" ON public.aptitude_attempts;
CREATE POLICY "Full access on aptitude_attempts" ON public.aptitude_attempts FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on leetcode_progress" ON public.leetcode_progress;
CREATE POLICY "Full access on leetcode_progress" ON public.leetcode_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on roadmap_progress" ON public.roadmap_progress;
CREATE POLICY "Full access on roadmap_progress" ON public.roadmap_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on resume_scores" ON public.resume_scores;
CREATE POLICY "Full access on resume_scores" ON public.resume_scores FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on saved_playlists" ON public.saved_playlists;
CREATE POLICY "Full access on saved_playlists" ON public.saved_playlists FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on video_progress" ON public.video_progress;
CREATE POLICY "Full access on video_progress" ON public.video_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on learning_progress" ON public.learning_progress;
CREATE POLICY "Full access on learning_progress" ON public.learning_progress FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, anon, authenticated;
