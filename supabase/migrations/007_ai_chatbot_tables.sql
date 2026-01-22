-- ============================================
-- AI Chatbot Survey System Tables
-- Migration: 007_ai_chatbot_tables.sql
-- ============================================

-- 1. AI 설문 (AI Surveys)
CREATE TABLE ai_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  allow_hint BOOLEAN DEFAULT true,
  max_hints_per_question INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI 문제 (AI Questions)
CREATE TABLE ai_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES ai_surveys(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'both')),
  correct_answer TEXT,
  evaluation_prompt TEXT,
  hint_prompt TEXT,
  auto_progress BOOLEAN DEFAULT false,
  progress_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 선택지 (AI Options)
CREATE TABLE ai_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES ai_questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- 4. AI 접속 코드 (AI Access Codes)
CREATE TABLE ai_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES ai_surveys(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 챗봇 세션 (AI Chat Sessions)
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES ai_surveys(id) ON DELETE CASCADE,
  access_code_id UUID REFERENCES ai_access_codes(id),
  student_id TEXT,
  student_name TEXT,
  current_question_index INTEGER DEFAULT 0,
  hints_used JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- 6. 챗봇 메시지 (AI Chat Messages)
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES ai_questions(id),
  message_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'options')),
  message_type TEXT CHECK (message_type IN ('answer', 'hint_request', 'hint', 'evaluation', 'final_answer', 'system')),
  selected_option_id UUID REFERENCES ai_options(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_ai_surveys_user_id ON ai_surveys(user_id);
CREATE INDEX idx_ai_questions_survey_id ON ai_questions(survey_id);
CREATE INDEX idx_ai_questions_order ON ai_questions(survey_id, order_index);
CREATE INDEX idx_ai_options_question_id ON ai_options(question_id);
CREATE INDEX idx_ai_access_codes_survey_id ON ai_access_codes(survey_id);
CREATE INDEX idx_ai_access_codes_code ON ai_access_codes(code);
CREATE INDEX idx_ai_chat_sessions_survey_id ON ai_chat_sessions(survey_id);
CREATE INDEX idx_ai_chat_sessions_access_code_id ON ai_chat_sessions(access_code_id);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_question_id ON ai_chat_messages(question_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE ai_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- AI Surveys Policies
CREATE POLICY "Users can view their own AI surveys"
  ON ai_surveys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create AI surveys"
  ON ai_surveys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI surveys"
  ON ai_surveys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI surveys"
  ON ai_surveys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- AI Questions Policies
CREATE POLICY "Users can view questions of their surveys"
  ON ai_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_questions.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions in their surveys"
  ON ai_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their surveys"
  ON ai_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_questions.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions in their surveys"
  ON ai_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_questions.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

-- AI Options Policies
CREATE POLICY "Users can view options of their questions"
  ON ai_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_questions
      JOIN ai_surveys ON ai_surveys.id = ai_questions.survey_id
      WHERE ai_questions.id = ai_options.question_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create options in their questions"
  ON ai_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_questions
      JOIN ai_surveys ON ai_surveys.id = ai_questions.survey_id
      WHERE ai_questions.id = question_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options in their questions"
  ON ai_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_questions
      JOIN ai_surveys ON ai_surveys.id = ai_questions.survey_id
      WHERE ai_questions.id = ai_options.question_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options in their questions"
  ON ai_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_questions
      JOIN ai_surveys ON ai_surveys.id = ai_questions.survey_id
      WHERE ai_questions.id = ai_options.question_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

-- AI Access Codes Policies
CREATE POLICY "Users can view codes of their surveys"
  ON ai_access_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_access_codes.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create codes for their surveys"
  ON ai_access_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update codes for their surveys"
  ON ai_access_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_access_codes.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete codes for their surveys"
  ON ai_access_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_access_codes.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

-- AI Chat Sessions Policies (need anon access for students)
CREATE POLICY "Authenticated users can view sessions of their surveys"
  ON ai_chat_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_chat_sessions.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create chat sessions"
  ON ai_chat_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update their chat sessions"
  ON ai_chat_sessions FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sessions of their surveys"
  ON ai_chat_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_chat_sessions.survey_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

-- AI Chat Messages Policies
CREATE POLICY "Authenticated users can view messages of their surveys"
  ON ai_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      JOIN ai_surveys ON ai_surveys.id = ai_chat_sessions.survey_id
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create chat messages"
  ON ai_chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete messages of their surveys"
  ON ai_chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      JOIN ai_surveys ON ai_surveys.id = ai_chat_sessions.survey_id
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_surveys.user_id = auth.uid()
    )
  );

-- ============================================
-- Anon Access Policies for Student Flow
-- ============================================

-- Students need to read active surveys via access codes
CREATE POLICY "Anyone can view active AI surveys"
  ON ai_surveys FOR SELECT
  TO anon
  USING (is_active = true);

-- Students need to read questions
CREATE POLICY "Anyone can view questions of active surveys"
  ON ai_questions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM ai_surveys
      WHERE ai_surveys.id = ai_questions.survey_id
      AND ai_surveys.is_active = true
    )
  );

-- Students need to read options
CREATE POLICY "Anyone can view options of active surveys"
  ON ai_options FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM ai_questions
      JOIN ai_surveys ON ai_surveys.id = ai_questions.survey_id
      WHERE ai_questions.id = ai_options.question_id
      AND ai_surveys.is_active = true
    )
  );

-- Students need to verify access codes
CREATE POLICY "Anyone can view active access codes"
  ON ai_access_codes FOR SELECT
  TO anon
  USING (is_active = true);

-- Students need to view their own sessions
CREATE POLICY "Anyone can view chat sessions"
  ON ai_chat_sessions FOR SELECT
  TO anon
  USING (true);

-- Students need to view messages in their sessions
CREATE POLICY "Anyone can view chat messages"
  ON ai_chat_messages FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- Updated_at Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_ai_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_surveys_updated_at
  BEFORE UPDATE ON ai_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_survey_updated_at();
