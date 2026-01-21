-- ============================================
-- Fix SELECT RLS policies to allow anonymous access
-- for surveys, access_codes, survey_pages, questions, and options
-- ============================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Active surveys are viewable" ON surveys;
DROP POLICY IF EXISTS "Active access codes are viewable" ON access_codes;
DROP POLICY IF EXISTS "Survey pages of active surveys are viewable" ON survey_pages;
DROP POLICY IF EXISTS "Questions of active surveys are viewable" ON questions;
DROP POLICY IF EXISTS "Options of active surveys are viewable" ON options;

-- Recreate policies with explicit anon role support

-- surveys: Allow anonymous users to view active surveys
CREATE POLICY "Anon can view active surveys"
    ON surveys
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- access_codes: Allow anonymous users to view active codes
CREATE POLICY "Anon can view active access codes"
    ON access_codes
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- survey_pages: Allow anonymous users to view pages of active surveys
CREATE POLICY "Anon can view survey pages"
    ON survey_pages
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_pages.survey_id
            AND surveys.is_active = true
        )
    );

-- questions: Allow anonymous users to view questions of active surveys
CREATE POLICY "Anon can view survey questions"
    ON questions
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = questions.survey_id
            AND surveys.is_active = true
        )
    );

-- options: Allow anonymous users to view options of active surveys
CREATE POLICY "Anon can view survey options"
    ON options
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN surveys ON surveys.id = questions.survey_id
            WHERE questions.id = options.question_id
            AND surveys.is_active = true
        )
    );
