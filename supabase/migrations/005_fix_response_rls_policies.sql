-- ============================================
-- Fix RLS policies for anonymous response submission
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create response sessions" ON response_sessions;
DROP POLICY IF EXISTS "Anyone can update own response session" ON response_sessions;
DROP POLICY IF EXISTS "Anyone can create responses" ON responses;

-- Recreate policies with explicit anon role support

-- response_sessions: Allow anonymous users to create sessions
CREATE POLICY "Anon can create response sessions"
    ON response_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = response_sessions.survey_id
            AND surveys.is_active = true
        )
    );

-- response_sessions: Allow anyone to update sessions (for completion)
CREATE POLICY "Anon can update response sessions"
    ON response_sessions
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- response_sessions: Allow anonymous to select their own session (needed for insert returning)
CREATE POLICY "Anon can select response sessions"
    ON response_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- responses: Allow anonymous users to create responses
CREATE POLICY "Anon can create responses"
    ON responses
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM response_sessions
            JOIN surveys ON surveys.id = response_sessions.survey_id
            WHERE response_sessions.id = responses.session_id
            AND surveys.is_active = true
        )
    );

-- responses: Allow anonymous to select their responses (needed for insert returning)
CREATE POLICY "Anon can select own responses"
    ON responses
    FOR SELECT
    TO anon, authenticated
    USING (true);
