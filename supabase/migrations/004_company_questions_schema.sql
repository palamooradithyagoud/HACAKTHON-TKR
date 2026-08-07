-- ── 004_COMPANY_QUESTIONS_SCHEMA.SQL ─────────────────────────
-- Supabase Schema Migration for Company-Wise LeetCode Interview Questions

CREATE TABLE IF NOT EXISTS public.company_questions (
    id             BIGSERIAL PRIMARY KEY,
    company_slug   TEXT NOT NULL,
    period         TEXT NOT NULL DEFAULT 'all',
    question_id    INTEGER NOT NULL,
    title          TEXT NOT NULL,
    url            TEXT DEFAULT '',
    difficulty     TEXT DEFAULT 'Easy',
    acceptance     TEXT DEFAULT '',
    frequency      TEXT DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT company_questions_slug_period_qid_unique UNIQUE (company_slug, period, question_id)
);

CREATE INDEX IF NOT EXISTS idx_company_q_slug ON public.company_questions(company_slug);
CREATE INDEX IF NOT EXISTS idx_company_q_period ON public.company_questions(period);
CREATE INDEX IF NOT EXISTS idx_company_q_difficulty ON public.company_questions(difficulty);

ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on company_questions" ON public.company_questions;
CREATE POLICY "Public select on company_questions" ON public.company_questions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Full access on company_questions" ON public.company_questions;
CREATE POLICY "Full access on company_questions" ON public.company_questions FOR ALL TO service_role, anon, authenticated USING (true) WITH CHECK (true);
