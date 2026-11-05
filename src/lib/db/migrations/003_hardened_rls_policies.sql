-- ==============================================================================
-- NEMOLEARN MIGRATION 003: HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase PostgreSQL (epbepzjheexkeqivcoql / ap-southeast-1)
-- Purpose: Restrict direct PostgREST anon access and enforce Least Privilege.
-- ==============================================================================

-- 1. DROP OVERLY PERMISSIVE POLICIES
DROP POLICY IF EXISTS "allow_backend_users" ON public.users;
DROP POLICY IF EXISTS "allow_backend_questions" ON public.questions;
DROP POLICY IF EXISTS "allow_backend_sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "allow_backend_responses" ON public.responses;
DROP POLICY IF EXISTS "allow_backend_reports" ON public.reports;
DROP POLICY IF EXISTS "allow_backend_system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "allow_backend_ai_metrics" ON public.ai_metrics_history;
DROP POLICY IF EXISTS "allow_backend_ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "allow_backend_website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "allow_backend_explanations" ON public.explanations;
DROP POLICY IF EXISTS "allow_backend_ai_user_quotas" ON public.ai_user_quotas;

-- 2. SERVICE ROLE FULL BYPASS POLICIES
-- Next.js server Route Handlers using SUPABASE_SERVICE_ROLE_KEY maintain authoritative access
CREATE POLICY "service_role_users_all" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_questions_all" ON public.questions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_sessions_all" ON public.practice_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_responses_all" ON public.responses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_reports_all" ON public.reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_system_logs_all" ON public.system_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_ai_metrics_all" ON public.ai_metrics_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_ai_settings_all" ON public.ai_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_website_settings_all" ON public.website_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_explanations_all" ON public.explanations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_ai_user_quotas_all" ON public.ai_user_quotas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. PUBLIC & ANONYMOUS POLICIES (READ-ONLY ON CURATED EDUCATIONAL CONTENT)
-- Anyone can view public educational subjects and topics
CREATE POLICY "public_read_subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "public_read_topics" ON public.topics
    FOR SELECT USING (true);

-- Anyone can read published questions (stems, options, hints), but cannot edit or delete
CREATE POLICY "public_read_published_questions" ON public.questions
    FOR SELECT USING (status = 'published');

-- 4. AUTHENTICATED USER ROW OWNERSHIP POLICIES
-- Users can read their own user profile
CREATE POLICY "users_read_own_profile" ON public.users
    FOR SELECT TO authenticated USING (auth.uid()::text = id OR auth.uid()::text = auth_provider_id);

-- Users can read their own practice sessions
CREATE POLICY "users_read_own_sessions" ON public.practice_sessions
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Users can read their own responses
CREATE POLICY "users_read_own_responses" ON public.responses
    FOR SELECT TO authenticated USING (
        session_id IN (
            SELECT id FROM public.practice_sessions WHERE user_id = auth.uid()::text
        )
    );

-- Any authenticated or anonymous user can submit an issue report (INSERT only)
CREATE POLICY "users_create_reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- 5. ADMINISTRATIVE RESTRICTIONS
-- System logs, AI settings, website settings, and quotas have NO public or anon access.
-- They can only be queried through the authenticated server backend.
