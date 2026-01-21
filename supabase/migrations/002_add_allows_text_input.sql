-- ============================================
-- Migration: Add allows_text_input to options
-- ============================================
-- 선택지에 "기타 입력" 기능 추가
-- 이 옵션을 선택하면 추가 텍스트 입력 필드가 표시됨

ALTER TABLE options
ADD COLUMN allows_text_input BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN options.allows_text_input IS '선택 시 추가 텍스트 입력 허용 (기타 입력용)';
