// ============================================
// Survey Platform - TypeScript Type Definitions
// ============================================

// --------------------------------------------
// Base Types
// --------------------------------------------

export type QuestionType = 'single' | 'multiple' | 'text' | 'single_choice' | 'multiple_choice' | 'inline_text'

export type ImagePosition = 'left' | 'right' | 'top' | 'bottom'

// --------------------------------------------
// Respondent Info Types
// --------------------------------------------

/**
 * 설문 설정에서 정의하는 인적정보 필드
 */
export interface RespondentField {
  key: string        // 필드 키 (예: 'student_id', 'name')
  label: string      // 표시 레이블 (예: '학번', '이름')
  required: boolean  // 필수 여부
}

/**
 * 응답 세션에 저장되는 인적정보
 */
export interface RespondentInfo {
  [key: string]: string  // e.g., { student_id: "20260101", name: "홍길동" }
}

// --------------------------------------------
// Database Row Types (Supabase Tables)
// --------------------------------------------

export interface SurveyRow {
  id: string
  title: string
  description: string | null
  user_id: string
  is_active: boolean
  collect_respondent_info: boolean
  respondent_fields: RespondentField[] | null
  created_at: string
  updated_at: string
}

export interface AccessCodeRow {
  id: string
  survey_id: string
  code: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface SurveyPageRow {
  id: string
  survey_id: string
  page_index: number
  title: string | null
  image_url: string | null
  created_at: string
}

export interface QuestionRow {
  id: string
  survey_id: string
  page_index: number
  order_index: number
  type: QuestionType
  content: string
  is_required: boolean
  image_url: string | null
  image_position: ImagePosition
  is_page_break: boolean
  parent_question_id: string | null
  trigger_option_ids: string[] | null
  created_at: string
}

export interface OptionRow {
  id: string
  question_id: string
  order_index: number
  content: string
  allows_text_input: boolean  // 이 옵션 선택 시 추가 텍스트 입력 허용 (기타 입력용)
  created_at: string
}

export interface ResponseSessionRow {
  id: string
  survey_id: string
  access_code_id: string | null
  respondent_info: RespondentInfo | null
  started_at: string
  completed_at: string | null
}

export interface ResponseRow {
  id: string
  session_id: string
  question_id: string
  selected_option_ids: string[] | null
  text_response: string | null
  text_responses: Record<string, string> | null  // 인라인 입력용: { "1": "답변1", "2": "답변2" }
  created_at: string
}

// --------------------------------------------
// Insert Types (for creating new records)
// --------------------------------------------

export interface SurveyInsert {
  title: string
  description?: string | null
  user_id: string
  is_active?: boolean
  collect_respondent_info?: boolean
  respondent_fields?: RespondentField[] | null
}

export interface AccessCodeInsert {
  survey_id: string
  code: string
  expires_at?: string | null
  is_active?: boolean
}

export interface SurveyPageInsert {
  survey_id: string
  page_index: number
  title?: string | null
  image_url?: string | null
}

export interface QuestionInsert {
  survey_id: string
  page_index: number
  order_index: number
  type: QuestionType
  content: string
  is_required?: boolean
  image_url?: string | null
  image_position?: ImagePosition
  is_page_break?: boolean
  parent_question_id?: string | null
  trigger_option_ids?: string[] | null
}

export interface OptionInsert {
  question_id: string
  order_index: number
  content: string
  allows_text_input?: boolean
}

export interface ResponseSessionInsert {
  survey_id: string
  access_code_id?: string | null
  respondent_info?: RespondentInfo | null
  started_at?: string
  completed_at?: string | null
}

export interface ResponseInsert {
  session_id: string
  question_id: string
  selected_option_ids?: string[] | null
  text_response?: string | null
  text_responses?: Record<string, string> | null
}

// --------------------------------------------
// Update Types (for updating existing records)
// --------------------------------------------

export interface SurveyUpdate {
  title?: string
  description?: string | null
  is_active?: boolean
  collect_respondent_info?: boolean
  respondent_fields?: RespondentField[] | null
  updated_at?: string
}

export interface AccessCodeUpdate {
  code?: string
  expires_at?: string | null
  is_active?: boolean
}

export interface SurveyPageUpdate {
  page_index?: number
  title?: string | null
  image_url?: string | null
}

export interface QuestionUpdate {
  page_index?: number
  order_index?: number
  type?: QuestionType
  content?: string
  is_required?: boolean
  image_url?: string | null
  image_position?: ImagePosition
  is_page_break?: boolean
  parent_question_id?: string | null
  trigger_option_ids?: string[] | null
}

export interface OptionUpdate {
  order_index?: number
  content?: string
  allows_text_input?: boolean
}

export interface ResponseSessionUpdate {
  respondent_info?: RespondentInfo | null
  completed_at?: string | null
}

// --------------------------------------------
// Supabase Database Type
// --------------------------------------------

export interface Database {
  public: {
    Tables: {
      surveys: {
        Row: SurveyRow
        Insert: SurveyInsert
        Update: SurveyUpdate
      }
      access_codes: {
        Row: AccessCodeRow
        Insert: AccessCodeInsert
        Update: AccessCodeUpdate
      }
      survey_pages: {
        Row: SurveyPageRow
        Insert: SurveyPageInsert
        Update: SurveyPageUpdate
      }
      questions: {
        Row: QuestionRow
        Insert: QuestionInsert
        Update: QuestionUpdate
      }
      options: {
        Row: OptionRow
        Insert: OptionInsert
        Update: OptionUpdate
      }
      response_sessions: {
        Row: ResponseSessionRow
        Insert: ResponseSessionInsert
        Update: ResponseSessionUpdate
      }
      responses: {
        Row: ResponseRow
        Insert: ResponseInsert
        Update: Partial<ResponseInsert>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      question_type: QuestionType
    }
  }
}

// --------------------------------------------
// Extended Types (with relations)
// --------------------------------------------

/**
 * Option with full data
 */
export type Option = OptionRow

/**
 * Question with options
 */
export interface Question extends QuestionRow {
  options: Option[]
}

/**
 * Survey page with questions
 */
export interface SurveyPage extends SurveyPageRow {
  questions: Question[]
}

/**
 * Survey with all related data
 */
export interface Survey extends SurveyRow {
  access_codes?: AccessCodeRow[]
  pages?: SurveyPage[]
  questions?: Question[]
}

/**
 * Response with question data
 */
export interface Response extends ResponseRow {
  question?: Question
}

/**
 * Response session with responses
 */
export interface ResponseSession extends ResponseSessionRow {
  responses?: Response[]
  survey?: Survey
}

// --------------------------------------------
// API Response Types
// --------------------------------------------

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  message: string
  code?: string
  details?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// --------------------------------------------
// Survey Access Types
// --------------------------------------------

export interface SurveyAccess {
  survey: Survey
  accessCode: AccessCodeRow
  pages: SurveyPage[]
}

// --------------------------------------------
// Response Submission Types
// --------------------------------------------

export interface QuestionResponse {
  questionId: string
  selectedOptionIds?: string[]
  textResponse?: string
  textResponses?: Record<string, string>
}

export interface SubmitResponsesPayload {
  sessionId: string
  responses: QuestionResponse[]
}

// --------------------------------------------
// Auth Types
// --------------------------------------------

export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

// --------------------------------------------
// Realtime Types
// --------------------------------------------

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T> {
  eventType: RealtimeEvent
  new: T
  old: T | null
}

// --------------------------------------------
// Statistics Types
// --------------------------------------------

export interface SurveyStats {
  totalResponses: number
  completedResponses: number
  averageCompletionTime: number | null
}

export interface QuestionStats {
  questionId: string
  totalResponses: number
  optionCounts: Record<string, number>
  textResponses: string[]
}

// --------------------------------------------
// Export Utility Types
// --------------------------------------------

export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

// Helper type to get Row type from table name
export type TableRow<T extends TableName> = Tables[T]['Row']
export type TableInsert<T extends TableName> = Tables[T]['Insert']
export type TableUpdate<T extends TableName> = Tables[T]['Update']
