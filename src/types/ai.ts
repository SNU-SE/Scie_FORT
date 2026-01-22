// ============================================
// AI Chatbot Survey System - TypeScript Type Definitions
// ============================================

// --------------------------------------------
// Base Types
// --------------------------------------------

export type AIQuestionType = 'text' | 'multiple_choice' | 'both'

export type AISessionStatus = 'in_progress' | 'completed' | 'abandoned'

export type AIMessageRole = 'user' | 'assistant' | 'system'

export type AIContentType = 'text' | 'image' | 'options'

export type AIMessageType = 'answer' | 'hint_request' | 'hint' | 'evaluation' | 'final_answer' | 'system'

// --------------------------------------------
// Database Row Types (Supabase Tables)
// --------------------------------------------

export interface AISurveyRow {
  id: string
  user_id: string
  title: string
  description: string | null
  system_prompt: string | null
  allow_hint: boolean
  max_hints_per_question: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIQuestionRow {
  id: string
  survey_id: string
  order_index: number
  question_text: string
  question_image_url: string | null
  question_type: AIQuestionType
  correct_answer: string | null
  evaluation_prompt: string | null
  hint_prompt: string | null
  auto_progress: boolean
  progress_criteria: string | null
  created_at: string
}

export interface AIOptionRow {
  id: string
  question_id: string
  order_index: number
  option_text: string
  is_correct: boolean
}

export interface AIAccessCodeRow {
  id: string
  survey_id: string
  code: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface AIChatSessionRow {
  id: string
  survey_id: string
  access_code_id: string | null
  student_id: string | null
  student_name: string | null
  current_question_index: number
  hints_used: Record<string, number>  // { questionId: hintCount }
  started_at: string
  completed_at: string | null
  status: AISessionStatus
}

export interface AIChatMessageRow {
  id: string
  session_id: string
  question_id: string | null
  message_index: number
  role: AIMessageRole
  content: string
  content_type: AIContentType
  message_type: AIMessageType | null
  selected_option_id: string | null
  created_at: string
}

// --------------------------------------------
// Insert Types (for creating new records)
// --------------------------------------------

export interface AISurveyInsert {
  user_id: string
  title: string
  description?: string | null
  system_prompt?: string | null
  allow_hint?: boolean
  max_hints_per_question?: number
  is_active?: boolean
}

export interface AIQuestionInsert {
  survey_id: string
  order_index: number
  question_text: string
  question_image_url?: string | null
  question_type: AIQuestionType
  correct_answer?: string | null
  evaluation_prompt?: string | null
  hint_prompt?: string | null
  auto_progress?: boolean
  progress_criteria?: string | null
}

export interface AIOptionInsert {
  question_id: string
  order_index: number
  option_text: string
  is_correct?: boolean
}

export interface AIAccessCodeInsert {
  survey_id: string
  code: string
  expires_at?: string | null
  is_active?: boolean
}

export interface AIChatSessionInsert {
  survey_id: string
  access_code_id?: string | null
  student_id?: string | null
  student_name?: string | null
  current_question_index?: number
  hints_used?: Record<string, number>
  status?: AISessionStatus
}

export interface AIChatMessageInsert {
  session_id: string
  question_id?: string | null
  message_index: number
  role: AIMessageRole
  content: string
  content_type?: AIContentType
  message_type?: AIMessageType | null
  selected_option_id?: string | null
}

// --------------------------------------------
// Update Types (for updating existing records)
// --------------------------------------------

export interface AISurveyUpdate {
  title?: string
  description?: string | null
  system_prompt?: string | null
  allow_hint?: boolean
  max_hints_per_question?: number
  is_active?: boolean
  updated_at?: string
}

export interface AIQuestionUpdate {
  order_index?: number
  question_text?: string
  question_image_url?: string | null
  question_type?: AIQuestionType
  correct_answer?: string | null
  evaluation_prompt?: string | null
  hint_prompt?: string | null
  auto_progress?: boolean
  progress_criteria?: string | null
}

export interface AIOptionUpdate {
  order_index?: number
  option_text?: string
  is_correct?: boolean
}

export interface AIAccessCodeUpdate {
  code?: string
  expires_at?: string | null
  is_active?: boolean
}

export interface AIChatSessionUpdate {
  current_question_index?: number
  hints_used?: Record<string, number>
  completed_at?: string | null
  status?: AISessionStatus
}

// --------------------------------------------
// Extended Types (with relations)
// --------------------------------------------

export type AIOption = AIOptionRow

export interface AIQuestion extends AIQuestionRow {
  options: AIOption[]
}

export interface AISurvey extends AISurveyRow {
  access_codes?: AIAccessCodeRow[]
  questions?: AIQuestion[]
}

export interface AIChatMessage extends AIChatMessageRow {
  selected_option?: AIOption | null
}

export interface AIChatSession extends AIChatSessionRow {
  messages?: AIChatMessage[]
  survey?: AISurvey
}

// --------------------------------------------
// Frontend State Types
// --------------------------------------------

export interface ChatMessage {
  id: string
  role: AIMessageRole
  content: string
  content_type: AIContentType
  image_url?: string
  options?: AIOption[]
  selected_option_id?: string
  message_type?: AIMessageType | null
  isStreaming?: boolean
  created_at: string
}

export interface StudentInfo {
  student_id: string
  student_name: string
}

// --------------------------------------------
// API Request/Response Types
// --------------------------------------------

export interface AIChatRequest {
  sessionId: string
  questionId: string
  userMessage: string
  messageType: 'answer' | 'hint_request'
  selectedOptionId?: string
}

export interface AIChatResponse {
  message: string
  messageType: AIMessageType
  shouldProgress?: boolean
}

export interface AIStreamChunk {
  type: 'content' | 'done' | 'error'
  content?: string
  messageType?: AIMessageType
  shouldProgress?: boolean
  error?: string
}

// --------------------------------------------
// Survey Access Types
// --------------------------------------------

export interface AISurveyAccess {
  survey: AISurvey
  accessCode: AIAccessCodeRow
  questions: AIQuestion[]
}

// --------------------------------------------
// Excel Export Types
// --------------------------------------------

export interface AIExcelExportRow {
  studentId: string
  studentName: string
  questionNumber: number
  role: string
  messageType: string
  content: string
  selectedOption: string
  timestamp: string
}
