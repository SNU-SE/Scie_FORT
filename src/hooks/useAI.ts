import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AISurvey,
  AISurveyRow,
  AISurveyInsert,
  AISurveyUpdate,
  AIQuestion,
  AIQuestionRow,
  AIQuestionInsert,
  AIQuestionUpdate,
  AIOption,
  AIOptionInsert,
  AIOptionUpdate,
  AIAccessCodeRow,
  AIAccessCodeInsert,
  AIAccessCodeUpdate,
  AIChatSession,
  AIChatSessionRow,
  AIChatSessionInsert,
  AIChatSessionUpdate,
  AIChatMessage,
  AIChatMessageInsert,
  ApiError,
} from '@/types'

// ============================================
// Query Keys
// ============================================

export const aiKeys = {
  all: ['ai'] as const,
  surveys: () => [...aiKeys.all, 'surveys'] as const,
  surveyList: (userId: string) => [...aiKeys.surveys(), 'list', userId] as const,
  surveyDetail: (id: string) => [...aiKeys.surveys(), 'detail', id] as const,
  surveyByCode: (code: string) => [...aiKeys.surveys(), 'code', code] as const,
  questions: (surveyId: string) => [...aiKeys.all, 'questions', surveyId] as const,
  sessions: (surveyId: string) => [...aiKeys.all, 'sessions', surveyId] as const,
  session: (sessionId: string) => [...aiKeys.all, 'session', sessionId] as const,
  messages: (sessionId: string) => [...aiKeys.all, 'messages', sessionId] as const,
}

// ============================================
// API Functions - Surveys
// ============================================

async function fetchAISurveys(userId: string): Promise<AISurveyRow[]> {
  const { data, error } = await supabase
    .from('ai_surveys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function fetchAISurveyDetail(surveyId: string): Promise<AISurvey> {
  // 설문 기본 정보
  const { data: survey, error: surveyError } = await supabase
    .from('ai_surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (surveyError) throw surveyError

  // 접근 코드
  const { data: accessCodes, error: codesError } = await supabase
    .from('ai_access_codes')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false })

  if (codesError) throw codesError

  // 질문 (옵션 포함)
  const { data: questions, error: questionsError } = await supabase
    .from('ai_questions')
    .select(`
      *,
      ai_options (*)
    `)
    .eq('survey_id', surveyId)
    .order('order_index', { ascending: true })

  if (questionsError) throw questionsError

  // 옵션 정렬
  const sortedQuestions = questions.map(q => ({
    ...q,
    options: (q.ai_options as AIOption[]).sort((a, b) => a.order_index - b.order_index),
  })) as AIQuestion[]

  return {
    ...survey,
    access_codes: accessCodes,
    questions: sortedQuestions,
  }
}

async function fetchAISurveyByCode(code: string): Promise<AISurvey | null> {
  // 접근 코드 조회
  const { data: accessCode, error: codeError } = await supabase
    .from('ai_access_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (codeError) {
    if (codeError.code === 'PGRST116') return null
    throw codeError
  }

  // 만료 확인
  if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
    return null
  }

  // 설문 상세 조회
  const survey = await fetchAISurveyDetail(accessCode.survey_id)

  // 활성 상태 확인
  if (!survey.is_active) return null

  return survey
}

async function createAISurvey(data: AISurveyInsert): Promise<AISurveyRow> {
  const { data: survey, error } = await supabase
    .from('ai_surveys')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return survey
}

async function updateAISurvey(id: string, data: AISurveyUpdate): Promise<AISurveyRow> {
  const { data: survey, error } = await supabase
    .from('ai_surveys')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return survey
}

async function deleteAISurvey(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_surveys')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// API Functions - Questions
// ============================================

async function fetchAIQuestions(surveyId: string): Promise<AIQuestion[]> {
  const { data, error } = await supabase
    .from('ai_questions')
    .select(`
      *,
      ai_options (*)
    `)
    .eq('survey_id', surveyId)
    .order('order_index', { ascending: true })

  if (error) throw error

  return data.map(q => ({
    ...q,
    options: (q.ai_options as AIOption[]).sort((a, b) => a.order_index - b.order_index),
  })) as AIQuestion[]
}

async function createAIQuestion(
  data: AIQuestionInsert,
  options?: Omit<AIOptionInsert, 'question_id'>[]
): Promise<AIQuestion> {
  const { data: question, error: questionError } = await supabase
    .from('ai_questions')
    .insert(data)
    .select()
    .single()

  if (questionError) throw questionError

  let createdOptions: AIOption[] = []

  if (options && options.length > 0) {
    const optionsWithQuestionId = options.map(opt => ({
      ...opt,
      question_id: question.id,
    }))

    const { data: opts, error: optionsError } = await supabase
      .from('ai_options')
      .insert(optionsWithQuestionId)
      .select()

    if (optionsError) throw optionsError
    createdOptions = opts
  }

  return {
    ...question,
    options: createdOptions,
  }
}

async function updateAIQuestion(id: string, data: AIQuestionUpdate): Promise<AIQuestionRow> {
  const { data: question, error } = await supabase
    .from('ai_questions')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return question
}

async function deleteAIQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// API Functions - Options
// ============================================

async function createAIOption(data: AIOptionInsert): Promise<AIOption> {
  const { data: option, error } = await supabase
    .from('ai_options')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return option
}

async function updateAIOption(id: string, data: AIOptionUpdate): Promise<AIOption> {
  const { data: option, error } = await supabase
    .from('ai_options')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return option
}

async function deleteAIOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_options')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// API Functions - Access Codes
// ============================================

async function createAIAccessCode(data: AIAccessCodeInsert): Promise<AIAccessCodeRow> {
  const { data: code, error } = await supabase
    .from('ai_access_codes')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return code
}

async function updateAIAccessCode(id: string, data: AIAccessCodeUpdate): Promise<AIAccessCodeRow> {
  const { data: code, error } = await supabase
    .from('ai_access_codes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return code
}

async function deleteAIAccessCode(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_access_codes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// API Functions - Chat Sessions
// ============================================

async function fetchAISessions(surveyId: string): Promise<AIChatSessionRow[]> {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

async function fetchAISession(sessionId: string): Promise<AIChatSession> {
  const { data: session, error: sessionError } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError) throw sessionError

  const { data: messages, error: messagesError } = await supabase
    .from('ai_chat_messages')
    .select(`
      *,
      ai_options (*)
    `)
    .eq('session_id', sessionId)
    .order('message_index', { ascending: true })

  if (messagesError) throw messagesError

  return {
    ...session,
    messages: messages.map(m => ({
      ...m,
      selected_option: m.ai_options || null,
    })) as AIChatMessage[],
  }
}

async function createAISession(data: AIChatSessionInsert): Promise<AIChatSessionRow> {
  const { data: session, error } = await supabase
    .from('ai_chat_sessions')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return session
}

async function updateAISession(id: string, data: AIChatSessionUpdate): Promise<AIChatSessionRow> {
  const { data: session, error } = await supabase
    .from('ai_chat_sessions')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return session
}

// ============================================
// API Functions - Chat Messages
// ============================================

async function fetchAIMessages(sessionId: string): Promise<AIChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('message_index', { ascending: true })

  if (error) throw error
  return data as AIChatMessage[]
}

async function createAIMessage(data: AIChatMessageInsert): Promise<AIChatMessage> {
  const { data: message, error } = await supabase
    .from('ai_chat_messages')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return message as AIChatMessage
}

async function getNextMessageIndex(sessionId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('message_index')
    .eq('session_id', sessionId)
    .order('message_index', { ascending: false })
    .limit(1)

  if (error) throw error
  return data.length > 0 ? data[0].message_index + 1 : 0
}

// ============================================
// React Query Hooks - Surveys
// ============================================

export function useAISurveys(userId: string | undefined): UseQueryResult<AISurveyRow[], ApiError> {
  return useQuery({
    queryKey: aiKeys.surveyList(userId ?? ''),
    queryFn: () => fetchAISurveys(userId!),
    enabled: !!userId,
  })
}

export function useAISurveyDetail(surveyId: string | undefined): UseQueryResult<AISurvey, ApiError> {
  return useQuery({
    queryKey: aiKeys.surveyDetail(surveyId ?? ''),
    queryFn: () => fetchAISurveyDetail(surveyId!),
    enabled: !!surveyId,
  })
}

export function useAISurveyByCode(code: string | undefined): UseQueryResult<AISurvey | null, ApiError> {
  return useQuery({
    queryKey: aiKeys.surveyByCode(code ?? ''),
    queryFn: () => fetchAISurveyByCode(code!),
    enabled: !!code,
  })
}

export function useCreateAISurvey(): UseMutationResult<AISurveyRow, ApiError, AISurveyInsert> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAISurvey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyList(data.user_id) })
    },
  })
}

export function useUpdateAISurvey(): UseMutationResult<
  AISurveyRow,
  ApiError,
  { id: string; data: AISurveyUpdate }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateAISurvey(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(data.id) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyList(data.user_id) })
    },
  })
}

export function useDeleteAISurvey(): UseMutationResult<
  void,
  ApiError,
  { id: string; userId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAISurvey(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyList(variables.userId) })
    },
  })
}

// ============================================
// React Query Hooks - Questions
// ============================================

export function useAIQuestions(surveyId: string | undefined): UseQueryResult<AIQuestion[], ApiError> {
  return useQuery({
    queryKey: aiKeys.questions(surveyId ?? ''),
    queryFn: () => fetchAIQuestions(surveyId!),
    enabled: !!surveyId,
  })
}

export function useCreateAIQuestion(): UseMutationResult<
  AIQuestion,
  ApiError,
  { data: AIQuestionInsert; options?: Omit<AIOptionInsert, 'question_id'>[] }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, options }) => createAIQuestion(data, options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(data.survey_id) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(data.survey_id) })
    },
  })
}

export function useUpdateAIQuestion(): UseMutationResult<
  AIQuestionRow,
  ApiError,
  { id: string; data: AIQuestionUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateAIQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

export function useDeleteAIQuestion(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAIQuestion(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

// ============================================
// React Query Hooks - Options
// ============================================

export function useCreateAIOption(): UseMutationResult<
  AIOption,
  ApiError,
  { data: AIOptionInsert; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data }) => createAIOption(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

export function useUpdateAIOption(): UseMutationResult<
  AIOption,
  ApiError,
  { id: string; data: AIOptionUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateAIOption(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

export function useDeleteAIOption(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAIOption(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

// ============================================
// React Query Hooks - Access Codes
// ============================================

export function useCreateAIAccessCode(): UseMutationResult<
  AIAccessCodeRow,
  ApiError,
  AIAccessCodeInsert
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAIAccessCode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(data.survey_id) })
    },
  })
}

export function useUpdateAIAccessCode(): UseMutationResult<
  AIAccessCodeRow,
  ApiError,
  { id: string; surveyId: string; data: AIAccessCodeUpdate }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateAIAccessCode(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

export function useDeleteAIAccessCode(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAIAccessCode(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.surveyDetail(variables.surveyId) })
    },
  })
}

// ============================================
// React Query Hooks - Sessions
// ============================================

export function useAISessions(surveyId: string | undefined): UseQueryResult<AIChatSessionRow[], ApiError> {
  return useQuery({
    queryKey: aiKeys.sessions(surveyId ?? ''),
    queryFn: () => fetchAISessions(surveyId!),
    enabled: !!surveyId,
  })
}

export function useAISession(sessionId: string | undefined): UseQueryResult<AIChatSession, ApiError> {
  return useQuery({
    queryKey: aiKeys.session(sessionId ?? ''),
    queryFn: () => fetchAISession(sessionId!),
    enabled: !!sessionId,
  })
}

export function useCreateAISession(): UseMutationResult<AIChatSessionRow, ApiError, AIChatSessionInsert> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAISession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions(data.survey_id) })
    },
  })
}

export function useUpdateAISession(): UseMutationResult<
  AIChatSessionRow,
  ApiError,
  { id: string; data: AIChatSessionUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateAISession(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.session(data.id) })
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions(variables.surveyId) })
    },
  })
}

// ============================================
// React Query Hooks - Messages
// ============================================

export function useAIMessages(sessionId: string | undefined): UseQueryResult<AIChatMessage[], ApiError> {
  return useQuery({
    queryKey: aiKeys.messages(sessionId ?? ''),
    queryFn: () => fetchAIMessages(sessionId!),
    enabled: !!sessionId,
  })
}

export function useCreateAIMessage(): UseMutationResult<
  AIChatMessage,
  ApiError,
  { data: Omit<AIChatMessageInsert, 'message_index'>; sessionId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, sessionId }) => {
      const messageIndex = await getNextMessageIndex(sessionId)
      return createAIMessage({ ...data, message_index: messageIndex })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.messages(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: aiKeys.session(variables.sessionId) })
    },
  })
}

// ============================================
// Utility Functions for Chat
// ============================================

export async function saveAIMessage(
  sessionId: string,
  data: Omit<AIChatMessageInsert, 'session_id' | 'message_index'>
): Promise<AIChatMessage> {
  const messageIndex = await getNextMessageIndex(sessionId)
  return createAIMessage({
    ...data,
    session_id: sessionId,
    message_index: messageIndex,
  })
}

export { fetchAISurveyByCode, getNextMessageIndex }
