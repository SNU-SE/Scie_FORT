import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ResponseSession,
  ResponseSessionRow,
  ResponseSessionInsert,
  Response,
  ResponseRow,
  ResponseInsert,
  RespondentInfo,
  QuestionResponse,
  SubmitResponsesPayload,
  ApiError,
} from '@/types'

// ============================================
// Query Keys
// ============================================

export const responseKeys = {
  all: ['responses'] as const,
  sessions: () => [...responseKeys.all, 'sessions'] as const,
  sessionsBySurvey: (surveyId: string) => [...responseKeys.sessions(), surveyId] as const,
  session: (sessionId: string) => [...responseKeys.sessions(), 'detail', sessionId] as const,
  bySurvey: (surveyId: string) => [...responseKeys.all, 'survey', surveyId] as const,
}

// ============================================
// API Functions
// ============================================

/**
 * 응답 세션 생성
 */
async function createResponseSession(
  data: ResponseSessionInsert
): Promise<ResponseSessionRow> {
  console.log('[useResponses.createResponseSession] called', { data })
  try {
    console.log('[useResponses.createResponseSession] API request', { data })
    const { data: session, error } = await supabase
      .from('response_sessions')
      .insert({
        ...data,
        started_at: data.started_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    console.log('[useResponses.createResponseSession] API response', { session, error })
    if (error) {
      console.error('[useResponses.createResponseSession] error', error)
      throw error
    }
    return session
  } catch (error) {
    console.error('[useResponses.createResponseSession] catch error', error)
    throw error
  }
}

/**
 * 응답 세션 업데이트 (완료 처리, 인적정보 저장)
 */
async function updateResponseSession(
  sessionId: string,
  data: {
    respondent_info?: RespondentInfo | null
    completed_at?: string | null
  }
): Promise<ResponseSessionRow> {
  console.log('[useResponses.updateResponseSession] called', { sessionId, data })
  try {
    console.log('[useResponses.updateResponseSession] API request', { sessionId, data })
    const { data: session, error } = await supabase
      .from('response_sessions')
      .update(data)
      .eq('id', sessionId)
      .select()
      .single()

    console.log('[useResponses.updateResponseSession] API response', { session, error })
    if (error) {
      console.error('[useResponses.updateResponseSession] error', error)
      throw error
    }
    return session
  } catch (error) {
    console.error('[useResponses.updateResponseSession] catch error', error)
    throw error
  }
}

/**
 * 개별 응답 저장
 */
async function saveResponse(data: ResponseInsert): Promise<ResponseRow> {
  console.log('[useResponses.saveResponse] called', { data })
  try {
    console.log('[useResponses.saveResponse] API request', { data })
    const { data: response, error } = await supabase
      .from('responses')
      .upsert(data, {
        onConflict: 'session_id,question_id',
      })
      .select()
      .single()

    console.log('[useResponses.saveResponse] API response', { response, error })
    if (error) {
      console.error('[useResponses.saveResponse] error', error)
      throw error
    }
    return response
  } catch (error) {
    console.error('[useResponses.saveResponse] catch error', error)
    throw error
  }
}

/**
 * 다중 응답 일괄 저장
 */
async function submitResponses(payload: SubmitResponsesPayload): Promise<ResponseRow[]> {
  console.log('[useResponses.submitResponses] called', { payload })
  try {
    const { sessionId, responses } = payload

    const responseData: ResponseInsert[] = responses.map((r) => ({
      session_id: sessionId,
      question_id: r.questionId,
      selected_option_ids: r.selectedOptionIds ?? null,
      text_response: r.textResponse ?? null,
      text_responses: r.textResponses ?? null,
    }))

    console.log('[useResponses.submitResponses] API request', { responseData })
    const { data, error } = await supabase
      .from('responses')
      .upsert(responseData, {
        onConflict: 'session_id,question_id',
      })
      .select()

    console.log('[useResponses.submitResponses] API response', { data, error })
    if (error) {
      console.error('[useResponses.submitResponses] error', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('[useResponses.submitResponses] catch error', error)
    throw error
  }
}

/**
 * 응답 세션 완료 처리
 */
async function completeResponseSession(sessionId: string): Promise<ResponseSessionRow> {
  console.log('[useResponses.completeResponseSession] called', { sessionId })
  return updateResponseSession(sessionId, {
    completed_at: new Date().toISOString(),
  })
}

/**
 * 설문별 응답 세션 목록 조회
 */
async function fetchResponseSessionsBySurvey(surveyId: string): Promise<ResponseSession[]> {
  console.log('[useResponses.fetchResponseSessionsBySurvey] called', { surveyId })
  try {
    console.log('[useResponses.fetchResponseSessionsBySurvey] API request', { surveyId })
    const { data, error } = await supabase
      .from('response_sessions')
      .select(`
        *,
        responses (
          *,
          question:questions (
            id,
            content,
            type,
            page_index,
            order_index,
            options (*)
          )
        )
      `)
      .eq('survey_id', surveyId)
      .order('started_at', { ascending: false })

    console.log('[useResponses.fetchResponseSessionsBySurvey] API response', { data, error })
    if (error) {
      console.error('[useResponses.fetchResponseSessionsBySurvey] error', error)
      throw error
    }

    return data as ResponseSession[]
  } catch (error) {
    console.error('[useResponses.fetchResponseSessionsBySurvey] catch error', error)
    throw error
  }
}

/**
 * 단일 응답 세션 조회 (응답 포함)
 */
async function fetchResponseSession(sessionId: string): Promise<ResponseSession | null> {
  console.log('[useResponses.fetchResponseSession] called', { sessionId })
  try {
    console.log('[useResponses.fetchResponseSession] API request', { sessionId })
    const { data, error } = await supabase
      .from('response_sessions')
      .select(`
        *,
        survey:surveys (*),
        responses (
          *,
          question:questions (
            id,
            content,
            type,
            page_index,
            order_index,
            options (*)
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    console.log('[useResponses.fetchResponseSession] API response', { data, error })
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[useResponses.fetchResponseSession] session not found')
        return null
      }
      console.error('[useResponses.fetchResponseSession] error', error)
      throw error
    }

    return data as ResponseSession
  } catch (error) {
    console.error('[useResponses.fetchResponseSession] catch error', error)
    throw error
  }
}

/**
 * 설문별 응답 통계 조회
 */
async function fetchResponseStats(surveyId: string): Promise<{
  totalSessions: number
  completedSessions: number
  responsesByQuestion: Record<string, {
    totalResponses: number
    optionCounts: Record<string, number>
    textResponses: string[]
  }>
}> {
  console.log('[useResponses.fetchResponseStats] called', { surveyId })
  try {
    // 세션 통계
    console.log('[useResponses.fetchResponseStats] API request - sessions', { surveyId })
    const { data: sessions, error: sessionsError } = await supabase
      .from('response_sessions')
      .select('id, completed_at')
      .eq('survey_id', surveyId)

    console.log('[useResponses.fetchResponseStats] API response - sessions', { sessions, sessionsError })
    if (sessionsError) {
      console.error('[useResponses.fetchResponseStats] error - sessions', sessionsError)
      throw sessionsError
    }

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed_at).length

    // 응답 데이터
    console.log('[useResponses.fetchResponseStats] API request - responses')
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        question_id,
        selected_option_ids,
        text_response,
        text_responses
      `)
      .in('session_id', sessions.map(s => s.id))

    console.log('[useResponses.fetchResponseStats] API response - responses', { responses, responsesError })
    if (responsesError) {
      console.error('[useResponses.fetchResponseStats] error - responses', responsesError)
      throw responsesError
    }

    // 질문별 통계 집계
    const responsesByQuestion: Record<string, {
      totalResponses: number
      optionCounts: Record<string, number>
      textResponses: string[]
    }> = {}

    responses.forEach((response) => {
      const qId = response.question_id

      if (!responsesByQuestion[qId]) {
        responsesByQuestion[qId] = {
          totalResponses: 0,
          optionCounts: {},
          textResponses: [],
        }
      }

      responsesByQuestion[qId].totalResponses++

      // 선택지 카운트
      if (response.selected_option_ids) {
        response.selected_option_ids.forEach((optionId: string) => {
          responsesByQuestion[qId].optionCounts[optionId] =
            (responsesByQuestion[qId].optionCounts[optionId] || 0) + 1
        })
      }

      // 텍스트 응답
      if (response.text_response) {
        responsesByQuestion[qId].textResponses.push(response.text_response)
      }

      // 인라인 입력 응답
      if (response.text_responses) {
        Object.values(response.text_responses as Record<string, string>).forEach((text) => {
          if (text) {
            responsesByQuestion[qId].textResponses.push(text)
          }
        })
      }
    })

    console.log('[useResponses.fetchResponseStats] success', { totalSessions, completedSessions })
    return {
      totalSessions,
      completedSessions,
      responsesByQuestion,
    }
  } catch (error) {
    console.error('[useResponses.fetchResponseStats] catch error', error)
    throw error
  }
}

// ============================================
// React Query Hooks
// ============================================

/**
 * 응답 세션 생성 Hook
 */
export function useCreateResponseSession(): UseMutationResult<
  ResponseSessionRow,
  ApiError,
  ResponseSessionInsert
> {
  const queryClient = useQueryClient()
  console.log('[useCreateResponseSession] hook called')

  return useMutation({
    mutationFn: createResponseSession,
    onSuccess: (data) => {
      console.log('[useCreateResponseSession] onSuccess', { data })
      queryClient.invalidateQueries({
        queryKey: responseKeys.sessionsBySurvey(data.survey_id),
      })
    },
    onError: (error) => {
      console.error('[useCreateResponseSession] onError', error)
    },
  })
}

/**
 * 응답 세션 업데이트 Hook
 */
export function useUpdateResponseSession(): UseMutationResult<
  ResponseSessionRow,
  ApiError,
  {
    sessionId: string
    data: {
      respondent_info?: RespondentInfo | null
      completed_at?: string | null
    }
  }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateResponseSession] hook called')

  return useMutation({
    mutationFn: ({ sessionId, data }) => updateResponseSession(sessionId, data),
    onSuccess: (data) => {
      console.log('[useUpdateResponseSession] onSuccess', { data })
      queryClient.invalidateQueries({
        queryKey: responseKeys.session(data.id),
      })
      queryClient.invalidateQueries({
        queryKey: responseKeys.sessionsBySurvey(data.survey_id),
      })
    },
    onError: (error) => {
      console.error('[useUpdateResponseSession] onError', error)
    },
  })
}

/**
 * 개별 응답 저장 Hook
 */
export function useSaveResponse(): UseMutationResult<
  ResponseRow,
  ApiError,
  ResponseInsert
> {
  console.log('[useSaveResponse] hook called')

  return useMutation({
    mutationFn: saveResponse,
    onSuccess: (data) => {
      console.log('[useSaveResponse] onSuccess', { data })
    },
    onError: (error) => {
      console.error('[useSaveResponse] onError', error)
    },
  })
}

/**
 * 다중 응답 일괄 저장 Hook
 */
export function useSubmitResponses(): UseMutationResult<
  ResponseRow[],
  ApiError,
  SubmitResponsesPayload
> {
  const queryClient = useQueryClient()
  console.log('[useSubmitResponses] hook called')

  return useMutation({
    mutationFn: submitResponses,
    onSuccess: (data, variables) => {
      console.log('[useSubmitResponses] onSuccess', { data, variables })
      queryClient.invalidateQueries({
        queryKey: responseKeys.session(variables.sessionId),
      })
    },
    onError: (error) => {
      console.error('[useSubmitResponses] onError', error)
    },
  })
}

/**
 * 응답 세션 완료 Hook
 */
export function useCompleteResponseSession(): UseMutationResult<
  ResponseSessionRow,
  ApiError,
  { sessionId: string; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useCompleteResponseSession] hook called')

  return useMutation({
    mutationFn: ({ sessionId }) => completeResponseSession(sessionId),
    onSuccess: (data, variables) => {
      console.log('[useCompleteResponseSession] onSuccess', { data, variables })
      queryClient.invalidateQueries({
        queryKey: responseKeys.session(variables.sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: responseKeys.sessionsBySurvey(variables.surveyId),
      })
    },
    onError: (error) => {
      console.error('[useCompleteResponseSession] onError', error)
    },
  })
}

/**
 * 설문별 응답 세션 목록 조회 Hook
 */
export function useResponsesBySurvey(
  surveyId: string | undefined
): UseQueryResult<ResponseSession[], ApiError> {
  console.log('[useResponsesBySurvey] hook called', { surveyId })
  return useQuery({
    queryKey: responseKeys.sessionsBySurvey(surveyId ?? ''),
    queryFn: () => fetchResponseSessionsBySurvey(surveyId!),
    enabled: !!surveyId,
  })
}

/**
 * 단일 응답 세션 조회 Hook
 */
export function useResponseSession(
  sessionId: string | undefined
): UseQueryResult<ResponseSession | null, ApiError> {
  console.log('[useResponseSession] hook called', { sessionId })
  return useQuery({
    queryKey: responseKeys.session(sessionId ?? ''),
    queryFn: () => fetchResponseSession(sessionId!),
    enabled: !!sessionId,
  })
}

/**
 * 설문별 응답 통계 조회 Hook
 */
export function useResponseStats(
  surveyId: string | undefined
): UseQueryResult<{
  totalSessions: number
  completedSessions: number
  responsesByQuestion: Record<string, {
    totalResponses: number
    optionCounts: Record<string, number>
    textResponses: string[]
  }>
}, ApiError> {
  console.log('[useResponseStats] hook called', { surveyId })
  return useQuery({
    queryKey: [...responseKeys.bySurvey(surveyId ?? ''), 'stats'],
    queryFn: () => fetchResponseStats(surveyId!),
    enabled: !!surveyId,
  })
}

/**
 * 응답 제출 전체 플로우 (세션 생성 -> 인적정보 저장 -> 응답 저장 -> 완료)
 */
export function useSubmitSurveyResponse(): UseMutationResult<
  ResponseSessionRow,
  ApiError,
  {
    surveyId: string
    accessCodeId?: string
    respondentInfo?: RespondentInfo
    responses: QuestionResponse[]
  }
> {
  const queryClient = useQueryClient()
  console.log('[useSubmitSurveyResponse] hook called')

  return useMutation({
    mutationFn: async ({ surveyId, accessCodeId, respondentInfo, responses }) => {
      console.log('[useSubmitSurveyResponse] mutationFn called', { surveyId, accessCodeId, respondentInfo, responses })

      // 1. 세션 생성
      console.log('[useSubmitSurveyResponse] API request - create session')
      const { data: session, error: sessionError } = await supabase
        .from('response_sessions')
        .insert({
          survey_id: surveyId,
          access_code_id: accessCodeId ?? null,
          respondent_info: respondentInfo ?? null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log('[useSubmitSurveyResponse] API response - create session', { session, sessionError })
      if (sessionError) {
        console.error('[useSubmitSurveyResponse] error - create session', sessionError)
        throw sessionError
      }

      // 2. 응답 저장
      const responseData: ResponseInsert[] = responses.map((r) => ({
        session_id: session.id,
        question_id: r.questionId,
        selected_option_ids: r.selectedOptionIds ?? null,
        text_response: r.textResponse ?? null,
        text_responses: r.textResponses ?? null,
      }))

      if (responseData.length > 0) {
        console.log('[useSubmitSurveyResponse] API request - insert responses', { responseData })
        const { error: responsesError } = await supabase
          .from('responses')
          .insert(responseData)

        console.log('[useSubmitSurveyResponse] API response - insert responses', { responsesError })
        if (responsesError) {
          console.error('[useSubmitSurveyResponse] error - insert responses', responsesError)
          throw responsesError
        }
      }

      // 3. 세션 완료 처리
      console.log('[useSubmitSurveyResponse] API request - complete session')
      const { data: completedSession, error: completeError } = await supabase
        .from('response_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', session.id)
        .select()
        .single()

      console.log('[useSubmitSurveyResponse] API response - complete session', { completedSession, completeError })
      if (completeError) {
        console.error('[useSubmitSurveyResponse] error - complete session', completeError)
        throw completeError
      }

      console.log('[useSubmitSurveyResponse] success', { completedSession })
      return completedSession
    },
    onSuccess: (data) => {
      console.log('[useSubmitSurveyResponse] onSuccess', { data })
      queryClient.invalidateQueries({
        queryKey: responseKeys.sessionsBySurvey(data.survey_id),
      })
    },
    onError: (error) => {
      console.error('[useSubmitSurveyResponse] onError', error)
    },
  })
}

export default {
  useCreateResponseSession,
  useUpdateResponseSession,
  useSaveResponse,
  useSubmitResponses,
  useCompleteResponseSession,
  useResponsesBySurvey,
  useResponseSession,
  useResponseStats,
  useSubmitSurveyResponse,
}
