-- ============================================
-- Add image fields to questions table
-- ============================================

-- Add image_url column for question images
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Add image_position column for controlling image placement
-- Values: 'left', 'right', 'top', 'bottom'
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'left';

-- Add is_page_break column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_page_break BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN questions.image_url IS 'URL of the image to display with the question';
COMMENT ON COLUMN questions.image_position IS 'Position of the image relative to the question: left, right, top, bottom';
COMMENT ON COLUMN questions.is_page_break IS 'Whether this question is a page break marker';
