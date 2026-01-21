-- ============================================
-- Survey Platform - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

CREATE TYPE question_type AS ENUM ('single', 'multiple', 'text');

-- ============================================
-- Tables
-- ============================================

-- --------------------------------------------
-- surveys: 설문 기본 정보
-- --------------------------------------------
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    collect_respondent_info BOOLEAN NOT NULL DEFAULT false,
    respondent_fields JSONB DEFAULT NULL,
    -- respondent_fields 예시: [{"key": "student_id", "label": "학번", "required": true}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- access_codes: 설문 접근 코드
-- --------------------------------------------
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(code)
);

-- --------------------------------------------
-- survey_pages: 설문 페이지 (페이지별 이미지 지원)
-- --------------------------------------------
CREATE TABLE survey_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    page_index INTEGER NOT NULL,
    title TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(survey_id, page_index)
);

-- --------------------------------------------
-- questions: 질문
-- 조건부 질문: parent_question_id + trigger_option_ids
-- 인라인 입력: content에 {{input:1}}, {{input:2}} 마크업
-- --------------------------------------------
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    page_index INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL,
    type question_type NOT NULL,
    content TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    parent_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    trigger_option_ids UUID[] DEFAULT NULL,
    -- trigger_option_ids: 이 옵션들 중 하나라도 선택되면 질문 표시
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- options: 질문 선택지
-- --------------------------------------------
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- response_sessions: 응답 세션
-- respondent_info: 인적정보 저장 (JSONB)
-- --------------------------------------------
CREATE TABLE response_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
    respondent_info JSONB DEFAULT NULL,
    -- respondent_info 예시: {"student_id": "20260101", "name": "홍길동"}
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- --------------------------------------------
-- responses: 개별 질문 응답
-- text_responses: 인라인 입력 응답 (JSONB)
-- --------------------------------------------
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES response_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_ids UUID[],
    text_response TEXT,
    text_responses JSONB DEFAULT NULL,
    -- text_responses 예시: {"1": "답변1", "2": "답변2"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

-- ============================================
-- Indexes
-- ============================================

-- surveys 인덱스
CREATE INDEX idx_surveys_user_id ON surveys(user_id);
CREATE INDEX idx_surveys_is_active ON surveys(is_active);
CREATE INDEX idx_surveys_created_at ON surveys(created_at DESC);

-- access_codes 인덱스
CREATE INDEX idx_access_codes_survey_id ON access_codes(survey_id);
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_is_active ON access_codes(is_active);

-- survey_pages 인덱스
CREATE INDEX idx_survey_pages_survey_id ON survey_pages(survey_id);
CREATE INDEX idx_survey_pages_order ON survey_pages(survey_id, page_index);

-- questions 인덱스
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_questions_page_order ON questions(survey_id, page_index, order_index);
CREATE INDEX idx_questions_parent ON questions(parent_question_id);

-- options 인덱스
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_options_order ON options(question_id, order_index);

-- response_sessions 인덱스
CREATE INDEX idx_response_sessions_survey_id ON response_sessions(survey_id);
CREATE INDEX idx_response_sessions_access_code ON response_sessions(access_code_id);
CREATE INDEX idx_response_sessions_started_at ON response_sessions(started_at DESC);
CREATE INDEX idx_response_sessions_completed ON response_sessions(completed_at);

-- responses 인덱스
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);

-- ============================================
-- Triggers
-- ============================================

-- surveys updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- surveys 정책
-- --------------------------------------------

-- 소유자: 모든 작업 가능
CREATE POLICY "Users can manage own surveys"
    ON surveys
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 활성화된 설문은 누구나 조회 가능 (접근코드 확인은 애플리케이션에서)
CREATE POLICY "Active surveys are viewable"
    ON surveys
    FOR SELECT
    USING (is_active = true);

-- --------------------------------------------
-- access_codes 정책
-- --------------------------------------------

-- 소유자: 자신의 설문 코드 관리
CREATE POLICY "Users can manage own survey access codes"
    ON access_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = access_codes.survey_id
            AND surveys.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = access_codes.survey_id
            AND surveys.user_id = auth.uid()
        )
    );

-- 활성 코드는 누구나 조회 가능
CREATE POLICY "Active access codes are viewable"
    ON access_codes
    FOR SELECT
    USING (is_active = true);

-- --------------------------------------------
-- survey_pages 정책
-- --------------------------------------------

-- 소유자: 자신의 설문 페이지 관리
CREATE POLICY "Users can manage own survey pages"
    ON survey_pages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_pages.survey_id
            AND surveys.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_pages.survey_id
            AND surveys.user_id = auth.uid()
        )
    );

-- 활성 설문의 페이지는 누구나 조회 가능
CREATE POLICY "Survey pages of active surveys are viewable"
    ON survey_pages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_pages.survey_id
            AND surveys.is_active = true
        )
    );

-- --------------------------------------------
-- questions 정책
-- --------------------------------------------

-- 소유자: 자신의 설문 질문 관리
CREATE POLICY "Users can manage own survey questions"
    ON questions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = questions.survey_id
            AND surveys.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = questions.survey_id
            AND surveys.user_id = auth.uid()
        )
    );

-- 활성 설문의 질문은 누구나 조회 가능
CREATE POLICY "Questions of active surveys are viewable"
    ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = questions.survey_id
            AND surveys.is_active = true
        )
    );

-- --------------------------------------------
-- options 정책
-- --------------------------------------------

-- 소유자: 자신의 설문 옵션 관리
CREATE POLICY "Users can manage own survey options"
    ON options
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN surveys ON surveys.id = questions.survey_id
            WHERE questions.id = options.question_id
            AND surveys.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM questions
            JOIN surveys ON surveys.id = questions.survey_id
            WHERE questions.id = options.question_id
            AND surveys.user_id = auth.uid()
        )
    );

-- 활성 설문의 옵션은 누구나 조회 가능
CREATE POLICY "Options of active surveys are viewable"
    ON options
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN surveys ON surveys.id = questions.survey_id
            WHERE questions.id = options.question_id
            AND surveys.is_active = true
        )
    );

-- --------------------------------------------
-- response_sessions 정책
-- --------------------------------------------

-- 누구나 응답 세션 생성 가능 (익명 응답 지원)
CREATE POLICY "Anyone can create response sessions"
    ON response_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = response_sessions.survey_id
            AND surveys.is_active = true
        )
    );

-- 누구나 자신의 세션 업데이트 가능 (완료 처리)
CREATE POLICY "Anyone can update own response session"
    ON response_sessions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 소유자: 자신의 설문 응답 세션 조회
CREATE POLICY "Users can view own survey response sessions"
    ON response_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = response_sessions.survey_id
            AND surveys.user_id = auth.uid()
        )
    );

-- --------------------------------------------
-- responses 정책
-- --------------------------------------------

-- 누구나 응답 생성 가능
CREATE POLICY "Anyone can create responses"
    ON responses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM response_sessions
            JOIN surveys ON surveys.id = response_sessions.survey_id
            WHERE response_sessions.id = responses.session_id
            AND surveys.is_active = true
        )
    );

-- 소유자: 자신의 설문 응답 조회
CREATE POLICY "Users can view own survey responses"
    ON responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM response_sessions
            JOIN surveys ON surveys.id = response_sessions.survey_id
            WHERE response_sessions.id = responses.session_id
            AND surveys.user_id = auth.uid()
        )
    );

-- ============================================
-- Realtime 활성화
-- ============================================

-- responses 테이블에 대한 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE response_sessions;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE surveys IS '설문 기본 정보';
COMMENT ON COLUMN surveys.collect_respondent_info IS '인적정보 수집 여부';
COMMENT ON COLUMN surveys.respondent_fields IS '수집할 인적정보 필드 정의 (JSONB 배열)';

COMMENT ON TABLE access_codes IS '설문 접근 코드';

COMMENT ON TABLE survey_pages IS '설문 페이지 (페이지별 이미지 지원)';
COMMENT ON COLUMN survey_pages.image_url IS '페이지 상단에 표시할 이미지 URL';

COMMENT ON TABLE questions IS '설문 질문';
COMMENT ON COLUMN questions.page_index IS '질문이 속한 페이지 인덱스';
COMMENT ON COLUMN questions.parent_question_id IS '조건부 질문의 부모 질문 ID';
COMMENT ON COLUMN questions.trigger_option_ids IS '이 옵션들 중 하나가 선택되면 질문 표시';
COMMENT ON COLUMN questions.content IS '질문 내용 (인라인 입력: {{input:1}}, {{input:2}} 마크업 포함 가능)';

COMMENT ON TABLE options IS '질문 선택지';

COMMENT ON TABLE response_sessions IS '응답 세션';
COMMENT ON COLUMN response_sessions.respondent_info IS '응답자 인적정보 (JSONB)';

COMMENT ON TABLE responses IS '개별 질문 응답';
COMMENT ON COLUMN responses.text_responses IS '인라인 입력 응답 (JSONB: {"1": "답변1", "2": "답변2"})';
