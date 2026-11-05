-- ==============================================================================
-- NEMOLEARN PRODUCTION POSTGRESQL SCHEMA (SUPABASE)
-- Migrations: 001_initial_production_schema & 002_configure_backend_rls_policies
-- Database: Supabase PostgreSQL (epbepzjheexkeqivcoql / ap-southeast-1)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(64) PRIMARY KEY,
    auth_provider_id VARCHAR(128) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'pelajar', -- 'pelajar', 'guru', 'moderator', 'admin', 'owner'
    school VARCHAR(255),
    school_optional VARCHAR(255),
    gender VARCHAR(32) DEFAULT 'rahasia',
    avatar_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'pending'
    verification_status VARCHAR(32) DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
    nuptk VARCHAR(64),
    certificate_url TEXT,
    verification_notes TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(128),
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    reset_password_token VARCHAR(128),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    tos_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE,
    auth_provider VARCHAR(32) DEFAULT 'email',
    has_ai_access BOOLEAN DEFAULT FALSE,
    daily_ai_quota_override INT,
    ai_access_granted_by VARCHAR(64),
    ai_access_granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'saintek', 'soshum', 'umum'
    icon VARCHAR(64) NOT NULL DEFAULT 'BookOpen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id VARCHAR(64) PRIMARY KEY,
    subject_id VARCHAR(64) NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    subtopics_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. QUESTION SOURCES (PROVENANCE)
CREATE TABLE IF NOT EXISTS public.question_sources (
    id VARCHAR(64) PRIMARY KEY,
    source_type VARCHAR(64) NOT NULL,
    file_id_or_url TEXT,
    page_or_chunk TEXT,
    attribution TEXT,
    review_status VARCHAR(32) DEFAULT 'verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
    id VARCHAR(128) PRIMARY KEY,
    subject_id VARCHAR(64) NOT NULL,
    topic_id VARCHAR(64) NOT NULL,
    subtopic VARCHAR(128),
    level VARCHAR(32) NOT NULL DEFAULT 'SMA',
    type VARCHAR(32) NOT NULL DEFAULT 'pilihan_ganda',
    stem TEXT NOT NULL,
    options_json JSONB NOT NULL,
    correct_answer VARCHAR(8) NOT NULL,
    explanation TEXT NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    difficulty VARCHAR(32) NOT NULL DEFAULT 'sedang',
    source_type VARCHAR(64) DEFAULT 'curated_bank',
    source_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'published',
    version INT DEFAULT 1,
    hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRACTICE SESSIONS
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    config_json JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    question_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    score NUMERIC(5,2),
    correct_count INT,
    wrong_count INT,
    empty_count INT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. RESPONSES
CREATE TABLE IF NOT EXISTS public.responses (
    id VARCHAR(128) PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(128) NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer VARCHAR(8),
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_question UNIQUE (session_id, question_id)
);

-- 8. ISSUE REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id VARCHAR(128) PRIMARY KEY,
    question_id VARCHAR(128) NOT NULL,
    reporter_id VARCHAR(64) NOT NULL,
    reporter_email VARCHAR(255),
    reporter_name VARCHAR(128),
    issue_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(64)
);

-- 9. SYSTEM AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
    id VARCHAR(128) PRIMARY KEY,
    level VARCHAR(32) NOT NULL DEFAULT 'info',
    action VARCHAR(128) NOT NULL,
    actor_id VARCHAR(64),
    actor_email VARCHAR(255),
    actor_name VARCHAR(128),
    actor_role VARCHAR(32),
    target_type VARCHAR(64),
    target_id VARCHAR(128),
    ip_address VARCHAR(64),
    user_agent TEXT,
    details TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    category VARCHAR(64) NOT NULL DEFAULT 'system',
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AI TELEMETRY & METRICS HISTORY
CREATE TABLE IF NOT EXISTS public.ai_metrics_history (
    id VARCHAR(128) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    model VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    cost_usd NUMERIC(10,6) DEFAULT 0,
    latency_ms INT DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    user_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AI SETTINGS
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
    provider VARCHAR(64) NOT NULL DEFAULT 'gemini',
    model VARCHAR(64) NOT NULL DEFAULT 'gemini-1.5-flash',
    api_key_masked VARCHAR(64),
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    failover_enabled BOOLEAN DEFAULT TRUE,
    fallback_provider VARCHAR(64) DEFAULT 'openai',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64)
);

-- 12. WEBSITE SETTINGS
CREATE TABLE IF NOT EXISTS public.website_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
    app_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    maintenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    broadcast JSONB NOT NULL DEFAULT '{}'::jsonb,
    rate_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_routing JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_quota JSONB NOT NULL DEFAULT '{}'::jsonb,
    security JSONB NOT NULL DEFAULT '{}'::jsonb,
    api_keys JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64)
);

-- 13. QUESTION EXPLANATIONS (STEP-BY-STEP REASONING CACHE)
CREATE TABLE IF NOT EXISTS public.explanations (
    id VARCHAR(128) PRIMARY KEY,
    question_id VARCHAR(128) NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    depth VARCHAR(32) NOT NULL DEFAULT 'normal',
    content TEXT NOT NULL,
    provider VARCHAR(64),
    model VARCHAR(64),
    latency_ms INT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI USER QUOTAS (DAILY ASIA/JAKARTA USAGE TRACKING & RESERVATIONS)
CREATE TABLE IF NOT EXISTS public.ai_user_quotas (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quota_date VARCHAR(16) NOT NULL, -- YYYY-MM-DD in Asia/Jakarta timezone
    requests_used INT NOT NULL DEFAULT 0,
    requests_reserved INT NOT NULL DEFAULT 0,
    questions_generated INT NOT NULL DEFAULT 0,
    tokens_consumed INT NOT NULL DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quota_date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON public.responses(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs(category);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_created_at ON public.ai_metrics_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_ai_user_quotas_user_date ON public.ai_user_quotas(user_id, quota_date);
CREATE INDEX IF NOT EXISTS idx_ai_user_quotas_date ON public.ai_user_quotas(quota_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_quotas ENABLE ROW LEVEL SECURITY;

-- Helper functions for RBAC claims in JWT
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() ->> 'role', '') IN ('admin', 'owner')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner')
    OR current_user = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() ->> 'role', '') = 'owner'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
    OR current_user = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (MIGRATION 003 HARDENED)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_quotas ENABLE ROW LEVEL SECURITY;

-- Service Role Full Authoritative Access (Backend Server Routes via SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "service_role_users_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_questions_all" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_sessions_all" ON public.practice_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_responses_all" ON public.responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_reports_all" ON public.reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_system_logs_all" ON public.system_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_ai_metrics_all" ON public.ai_metrics_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_ai_settings_all" ON public.ai_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_website_settings_all" ON public.website_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_explanations_all" ON public.explanations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_ai_user_quotas_all" ON public.ai_user_quotas FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public Read-Only Content Policies
CREATE POLICY "public_read_subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "public_read_topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "public_read_published_questions" ON public.questions FOR SELECT USING (status = 'published');

-- Authenticated User Row Ownership Policies
CREATE POLICY "users_read_own_profile" ON public.users FOR SELECT TO authenticated USING (auth.uid()::text = id OR auth.uid()::text = auth_provider_id);
CREATE POLICY "users_read_own_sessions" ON public.practice_sessions FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "users_read_own_responses" ON public.responses FOR SELECT TO authenticated USING (
    session_id IN (SELECT id FROM public.practice_sessions WHERE user_id = auth.uid()::text)
);
CREATE POLICY "users_create_reports" ON public.reports FOR INSERT WITH CHECK (true);
