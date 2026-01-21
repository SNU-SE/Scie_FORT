import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  Survey,
  SurveyRow,
  SurveyInsert,
  SurveyUpdate,
  Question,
  QuestionRow,
  QuestionInsert,
  QuestionUpdate,
  Option,
  OptionInsert,
  OptionUpdate,
  SurveyPage,
  SurveyPageInsert,
  SurveyPageUpdate,
  AccessCodeRow,
  AccessCodeInsert,
  AccessCodeUpdate,
  ApiError,
} from '@/types'

// ============================================
// Query Keys
// ============================================

export const surveyKeys = {
  all: ['surveys'] as const,
  lists: () => [...surveyKeys.all, 'list'] as const,
  list: (userId: string) => [...surveyKeys.lists(), userId] as const,
  details: () => [...surveyKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveyKeys.details(), id] as const,
  byCode: (code: string) => [...surveyKeys.all, 'code', code] as const,
  questions: (surveyId: string) => [...surveyKeys.all, surveyId, 'questions'] as const,
  pages: (surveyId: string) => [...surveyKeys.all, surveyId, 'pages'] as const,
}

// ============================================
// API Functions
// ============================================

/**
 * 사용자의 설문 목록 조회
 */
async function fetchSurveys(userId: string): Promise<SurveyRow[]> {
  console.log('[useSurvey.fetchSurveys] called', { userId })
  try {
    console.log('[useSurvey.fetchSurveys] API request', { userId })
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('[useSurvey.fetchSurveys] API response', { data, error })
    if (error) {
      console.error('[useSurvey.fetchSurveys] error', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('[useSurvey.fetchSurveys] catch error', error)
    throw error
  }
}

/**
 * 설문 상세 조회 (질문, 옵션, 페이지 포함)
 */
async function fetchSurveyDetail(surveyId: string): Promise<Survey> {
  console.log('[useSurvey.fetchSurveyDetail] called', { surveyId })
  try {
    // 설문 기본 정보
    console.log('[useSurvey.fetchSurveyDetail] API request - survey')
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    console.log('[useSurvey.fetchSurveyDetail] API response - survey', { survey, surveyError })
    if (surveyError) {
      console.error('[useSurvey.fetchSurveyDetail] error - survey', surveyError)
      throw surveyError
    }

    // 접근 코드
    console.log('[useSurvey.fetchSurveyDetail] API request - access_codes')
    const { data: accessCodes, error: codesError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })

    console.log('[useSurvey.fetchSurveyDetail] API response - access_codes', { accessCodes, codesError })
    if (codesError) {
      console.error('[useSurvey.fetchSurveyDetail] error - access_codes', codesError)
      throw codesError
    }

    // 페이지
    console.log('[useSurvey.fetchSurveyDetail] API request - pages')
    const { data: pages, error: pagesError } = await supabase
      .from('survey_pages')
      .select('*')
      .eq('survey_id', surveyId)
      .order('page_index', { ascending: true })

    console.log('[useSurvey.fetchSurveyDetail] API response - pages', { pages, pagesError })
    if (pagesError) {
      console.error('[useSurvey.fetchSurveyDetail] error - pages', pagesError)
      throw pagesError
    }

    // 질문 (옵션 포함)
    console.log('[useSurvey.fetchSurveyDetail] API request - questions')
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('survey_id', surveyId)
      .order('page_index', { ascending: true })
      .order('order_index', { ascending: true })

    console.log('[useSurvey.fetchSurveyDetail] API response - questions', { questions, questionsError })
    if (questionsError) {
      console.error('[useSurvey.fetchSurveyDetail] error - questions', questionsError)
      throw questionsError
    }

    // 질문 옵션 정렬
    const sortedQuestions = questions.map(q => ({
      ...q,
      options: (q.options as Option[]).sort((a, b) => a.order_index - b.order_index),
    })) as Question[]

    // 페이지에 질문 매핑
    const pagesWithQuestions: SurveyPage[] = pages.map(page => ({
      ...page,
      questions: sortedQuestions.filter(q => q.page_index === page.page_index),
    }))

    console.log('[useSurvey.fetchSurveyDetail] success', { surveyId })
    return {
      ...survey,
      access_codes: accessCodes,
      pages: pagesWithQuestions,
      questions: sortedQuestions,
    }
  } catch (error) {
    console.error('[useSurvey.fetchSurveyDetail] catch error', error)
    throw error
  }
}

/**
 * 접근 코드로 설문 조회
 */
async function fetchSurveyByCode(code: string): Promise<Survey | null> {
  console.log('[useSurvey.fetchSurveyByCode] called', { code })
  try {
    // 접근 코드 조회
    console.log('[useSurvey.fetchSurveyByCode] API request - access_code')
    const { data: accessCode, error: codeError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    console.log('[useSurvey.fetchSurveyByCode] API response - access_code', { accessCode, codeError })
    if (codeError) {
      if (codeError.code === 'PGRST116') {
        console.log('[useSurvey.fetchSurveyByCode] access code not found')
        return null // Not found
      }
      console.error('[useSurvey.fetchSurveyByCode] error', codeError)
      throw codeError
    }

    // 만료 확인
    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      console.log('[useSurvey.fetchSurveyByCode] access code expired')
      return null
    }

    // 설문 상세 조회
    return fetchSurveyDetail(accessCode.survey_id)
  } catch (error) {
    console.error('[useSurvey.fetchSurveyByCode] catch error', error)
    throw error
  }
}

/**
 * 설문 생성
 */
async function createSurvey(data: SurveyInsert): Promise<SurveyRow> {
  console.log('[useSurvey.createSurvey] called', { data })
  try {
    console.log('[useSurvey.createSurvey] API request', { data })
    const { data: survey, error } = await supabase
      .from('surveys')
      .insert(data)
      .select()
      .single()

    console.log('[useSurvey.createSurvey] API response', { survey, error })
    if (error) {
      console.error('[useSurvey.createSurvey] error', error)
      throw error
    }
    return survey
  } catch (error) {
    console.error('[useSurvey.createSurvey] catch error', error)
    throw error
  }
}

/**
 * 설문 수정
 */
async function updateSurvey(id: string, data: SurveyUpdate): Promise<SurveyRow> {
  console.log('[useSurvey.updateSurvey] called', { id, data })
  try {
    console.log('[useSurvey.updateSurvey] API request', { id, data })
    const { data: survey, error } = await supabase
      .from('surveys')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    console.log('[useSurvey.updateSurvey] API response', { survey, error })
    if (error) {
      console.error('[useSurvey.updateSurvey] error', error)
      throw error
    }
    return survey
  } catch (error) {
    console.error('[useSurvey.updateSurvey] catch error', error)
    throw error
  }
}

/**
 * 설문 삭제
 */
async function deleteSurvey(id: string): Promise<void> {
  console.log('[useSurvey.deleteSurvey] called', { id })
  try {
    console.log('[useSurvey.deleteSurvey] API request', { id })
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id)

    console.log('[useSurvey.deleteSurvey] API response', { error })
    if (error) {
      console.error('[useSurvey.deleteSurvey] error', error)
      throw error
    }
  } catch (error) {
    console.error('[useSurvey.deleteSurvey] catch error', error)
    throw error
  }
}

/**
 * 질문 조회
 */
async function fetchQuestions(surveyId: string): Promise<Question[]> {
  console.log('[useSurvey.fetchQuestions] called', { surveyId })
  try {
    console.log('[useSurvey.fetchQuestions] API request', { surveyId })
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('survey_id', surveyId)
      .order('page_index', { ascending: true })
      .order('order_index', { ascending: true })

    console.log('[useSurvey.fetchQuestions] API response', { data, error })
    if (error) {
      console.error('[useSurvey.fetchQuestions] error', error)
      throw error
    }

    return data.map(q => ({
      ...q,
      options: (q.options as Option[]).sort((a, b) => a.order_index - b.order_index),
    })) as Question[]
  } catch (error) {
    console.error('[useSurvey.fetchQuestions] catch error', error)
    throw error
  }
}

/**
 * 질문 생성 (옵션 포함)
 */
async function createQuestion(
  data: QuestionInsert,
  options?: Omit<OptionInsert, 'question_id'>[]
): Promise<Question> {
  console.log('[useSurvey.createQuestion] called', { data, options })
  try {
    console.log('[useSurvey.createQuestion] API request - question', { data })
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert(data)
      .select()
      .single()

    console.log('[useSurvey.createQuestion] API response - question', { question, questionError })
    if (questionError) {
      console.error('[useSurvey.createQuestion] error - question', questionError)
      throw questionError
    }

    let createdOptions: Option[] = []

    if (options && options.length > 0) {
      const optionsWithQuestionId = options.map(opt => ({
        ...opt,
        question_id: question.id,
      }))

      console.log('[useSurvey.createQuestion] API request - options', { optionsWithQuestionId })
      const { data: opts, error: optionsError } = await supabase
        .from('options')
        .insert(optionsWithQuestionId)
        .select()

      console.log('[useSurvey.createQuestion] API response - options', { opts, optionsError })
      if (optionsError) {
        console.error('[useSurvey.createQuestion] error - options', optionsError)
        throw optionsError
      }
      createdOptions = opts
    }

    return {
      ...question,
      options: createdOptions,
    }
  } catch (error) {
    console.error('[useSurvey.createQuestion] catch error', error)
    throw error
  }
}

/**
 * 질문 수정
 */
async function updateQuestion(id: string, data: QuestionUpdate): Promise<QuestionRow> {
  console.log('[useSurvey.updateQuestion] called', { id, data })
  try {
    console.log('[useSurvey.updateQuestion] API request', { id, data })
    const { data: question, error } = await supabase
      .from('questions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    console.log('[useSurvey.updateQuestion] API response', { question, error })
    if (error) {
      console.error('[useSurvey.updateQuestion] error', error)
      throw error
    }
    return question
  } catch (error) {
    console.error('[useSurvey.updateQuestion] catch error', error)
    throw error
  }
}

/**
 * 질문 삭제
 */
async function deleteQuestion(id: string): Promise<void> {
  console.log('[useSurvey.deleteQuestion] called', { id })
  try {
    console.log('[useSurvey.deleteQuestion] API request', { id })
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    console.log('[useSurvey.deleteQuestion] API response', { error })
    if (error) {
      console.error('[useSurvey.deleteQuestion] error', error)
      throw error
    }
  } catch (error) {
    console.error('[useSurvey.deleteQuestion] catch error', error)
    throw error
  }
}

/**
 * 옵션 생성
 */
async function createOption(data: OptionInsert): Promise<Option> {
  console.log('[useSurvey.createOption] called', { data })
  try {
    console.log('[useSurvey.createOption] API request', { data })
    const { data: option, error } = await supabase
      .from('options')
      .insert(data)
      .select()
      .single()

    console.log('[useSurvey.createOption] API response', { option, error })
    if (error) {
      console.error('[useSurvey.createOption] error', error)
      throw error
    }
    return option
  } catch (error) {
    console.error('[useSurvey.createOption] catch error', error)
    throw error
  }
}

/**
 * 옵션 수정
 */
async function updateOption(id: string, data: OptionUpdate): Promise<Option> {
  console.log('[useSurvey.updateOption] called', { id, data })
  try {
    console.log('[useSurvey.updateOption] API request', { id, data })
    const { data: option, error } = await supabase
      .from('options')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    console.log('[useSurvey.updateOption] API response', { option, error })
    if (error) {
      console.error('[useSurvey.updateOption] error', error)
      throw error
    }
    return option
  } catch (error) {
    console.error('[useSurvey.updateOption] catch error', error)
    throw error
  }
}

/**
 * 옵션 삭제
 */
async function deleteOption(id: string): Promise<void> {
  console.log('[useSurvey.deleteOption] called', { id })
  try {
    console.log('[useSurvey.deleteOption] API request', { id })
    const { error } = await supabase
      .from('options')
      .delete()
      .eq('id', id)

    console.log('[useSurvey.deleteOption] API response', { error })
    if (error) {
      console.error('[useSurvey.deleteOption] error', error)
      throw error
    }
  } catch (error) {
    console.error('[useSurvey.deleteOption] catch error', error)
    throw error
  }
}

/**
 * 페이지 생성
 */
async function createSurveyPage(data: SurveyPageInsert): Promise<SurveyPage> {
  console.log('[useSurvey.createSurveyPage] called', { data })
  try {
    console.log('[useSurvey.createSurveyPage] API request', { data })
    const { data: page, error } = await supabase
      .from('survey_pages')
      .insert(data)
      .select()
      .single()

    console.log('[useSurvey.createSurveyPage] API response', { page, error })
    if (error) {
      console.error('[useSurvey.createSurveyPage] error', error)
      throw error
    }
    return { ...page, questions: [] }
  } catch (error) {
    console.error('[useSurvey.createSurveyPage] catch error', error)
    throw error
  }
}

/**
 * 페이지 수정
 */
async function updateSurveyPage(id: string, data: SurveyPageUpdate): Promise<SurveyPage> {
  console.log('[useSurvey.updateSurveyPage] called', { id, data })
  try {
    console.log('[useSurvey.updateSurveyPage] API request', { id, data })
    const { data: page, error } = await supabase
      .from('survey_pages')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    console.log('[useSurvey.updateSurveyPage] API response', { page, error })
    if (error) {
      console.error('[useSurvey.updateSurveyPage] error', error)
      throw error
    }
    return { ...page, questions: [] }
  } catch (error) {
    console.error('[useSurvey.updateSurveyPage] catch error', error)
    throw error
  }
}

/**
 * 페이지 삭제
 */
async function deleteSurveyPage(id: string): Promise<void> {
  console.log('[useSurvey.deleteSurveyPage] called', { id })
  try {
    console.log('[useSurvey.deleteSurveyPage] API request', { id })
    const { error } = await supabase
      .from('survey_pages')
      .delete()
      .eq('id', id)

    console.log('[useSurvey.deleteSurveyPage] API response', { error })
    if (error) {
      console.error('[useSurvey.deleteSurveyPage] error', error)
      throw error
    }
  } catch (error) {
    console.error('[useSurvey.deleteSurveyPage] catch error', error)
    throw error
  }
}

/**
 * 접근 코드 생성
 */
async function createAccessCode(data: AccessCodeInsert): Promise<AccessCodeRow> {
  console.log('[useSurvey.createAccessCode] called', { data })
  try {
    console.log('[useSurvey.createAccessCode] API request', { data })
    const { data: code, error } = await supabase
      .from('access_codes')
      .insert(data)
      .select()
      .single()

    console.log('[useSurvey.createAccessCode] API response', { code, error })
    if (error) {
      console.error('[useSurvey.createAccessCode] error', error)
      throw error
    }
    return code
  } catch (error) {
    console.error('[useSurvey.createAccessCode] catch error', error)
    throw error
  }
}

/**
 * 접근 코드 삭제
 */
async function deleteAccessCode(id: string): Promise<void> {
  console.log('[useSurvey.deleteAccessCode] called', { id })
  try {
    console.log('[useSurvey.deleteAccessCode] API request', { id })
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', id)

    console.log('[useSurvey.deleteAccessCode] API response', { error })
    if (error) {
      console.error('[useSurvey.deleteAccessCode] error', error)
      throw error
    }
  } catch (error) {
    console.error('[useSurvey.deleteAccessCode] catch error', error)
    throw error
  }
}

/**
 * 접근 코드 수정
 */
async function updateAccessCode(id: string, data: AccessCodeUpdate): Promise<AccessCodeRow> {
  console.log('[useSurvey.updateAccessCode] called', { id, data })
  try {
    console.log('[useSurvey.updateAccessCode] API request', { id, data })
    const { data: code, error } = await supabase
      .from('access_codes')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    console.log('[useSurvey.updateAccessCode] API response', { code, error })
    if (error) {
      console.error('[useSurvey.updateAccessCode] error', error)
      throw error
    }
    return code
  } catch (error) {
    console.error('[useSurvey.updateAccessCode] catch error', error)
    throw error
  }
}

// ============================================
// React Query Hooks
// ============================================

/**
 * 사용자의 설문 목록 조회 Hook
 */
export function useSurveys(userId: string | undefined): UseQueryResult<SurveyRow[], ApiError> {
  console.log('[useSurveys] hook called', { userId })
  return useQuery({
    queryKey: surveyKeys.list(userId ?? ''),
    queryFn: () => fetchSurveys(userId!),
    enabled: !!userId,
  })
}

/**
 * 설문 상세 조회 Hook
 */
export function useSurveyDetail(surveyId: string | undefined): UseQueryResult<Survey, ApiError> {
  console.log('[useSurveyDetail] hook called', { surveyId })
  return useQuery({
    queryKey: surveyKeys.detail(surveyId ?? ''),
    queryFn: () => fetchSurveyDetail(surveyId!),
    enabled: !!surveyId,
  })
}

/**
 * 접근 코드로 설문 조회 Hook
 */
export function useSurveyByCode(code: string | undefined): UseQueryResult<Survey | null, ApiError> {
  console.log('[useSurveyByCode] hook called', { code })
  return useQuery({
    queryKey: surveyKeys.byCode(code ?? ''),
    queryFn: () => fetchSurveyByCode(code!),
    enabled: !!code,
  })
}

/**
 * 질문 목록 조회 Hook
 */
export function useQuestions(surveyId: string | undefined): UseQueryResult<Question[], ApiError> {
  console.log('[useQuestions] hook called', { surveyId })
  return useQuery({
    queryKey: surveyKeys.questions(surveyId ?? ''),
    queryFn: () => fetchQuestions(surveyId!),
    enabled: !!surveyId,
  })
}

/**
 * 설문 생성 Hook
 */
export function useCreateSurvey(): UseMutationResult<SurveyRow, ApiError, SurveyInsert> {
  const queryClient = useQueryClient()
  console.log('[useCreateSurvey] hook called')

  return useMutation({
    mutationFn: createSurvey,
    onSuccess: (data) => {
      console.log('[useCreateSurvey] onSuccess', { data })
      queryClient.invalidateQueries({ queryKey: surveyKeys.list(data.user_id) })
    },
    onError: (error) => {
      console.error('[useCreateSurvey] onError', error)
    },
  })
}

/**
 * 설문 수정 Hook
 */
export function useUpdateSurvey(): UseMutationResult<
  SurveyRow,
  ApiError,
  { id: string; data: SurveyUpdate }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateSurvey] hook called')

  return useMutation({
    mutationFn: ({ id, data }) => updateSurvey(id, data),
    onSuccess: (data) => {
      console.log('[useUpdateSurvey] onSuccess', { data })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.list(data.user_id) })
    },
    onError: (error) => {
      console.error('[useUpdateSurvey] onError', error)
    },
  })
}

/**
 * 설문 삭제 Hook
 */
export function useDeleteSurvey(): UseMutationResult<
  void,
  ApiError,
  { id: string; userId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useDeleteSurvey] hook called')

  return useMutation({
    mutationFn: ({ id }) => deleteSurvey(id),
    onSuccess: (_, variables) => {
      console.log('[useDeleteSurvey] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.list(variables.userId) })
    },
    onError: (error) => {
      console.error('[useDeleteSurvey] onError', error)
    },
  })
}

/**
 * 질문 생성 Hook
 */
export function useCreateQuestion(): UseMutationResult<
  Question,
  ApiError,
  { data: QuestionInsert; options?: Omit<OptionInsert, 'question_id'>[] }
> {
  const queryClient = useQueryClient()
  console.log('[useCreateQuestion] hook called')

  return useMutation({
    mutationFn: ({ data, options }) => createQuestion(data, options),
    onSuccess: (data) => {
      console.log('[useCreateQuestion] onSuccess', { data })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(data.survey_id) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.survey_id) })
    },
    onError: (error) => {
      console.error('[useCreateQuestion] onError', error)
    },
  })
}

/**
 * 질문 수정 Hook
 */
export function useUpdateQuestion(): UseMutationResult<
  QuestionRow,
  ApiError,
  { id: string; data: QuestionUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateQuestion] hook called')

  return useMutation({
    mutationFn: ({ id, data }) => updateQuestion(id, data),
    onSuccess: (_, variables) => {
      console.log('[useUpdateQuestion] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useUpdateQuestion] onError', error)
    },
  })
}

/**
 * 질문 삭제 Hook
 */
export function useDeleteQuestion(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useDeleteQuestion] hook called')

  return useMutation({
    mutationFn: ({ id }) => deleteQuestion(id),
    onSuccess: (_, variables) => {
      console.log('[useDeleteQuestion] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useDeleteQuestion] onError', error)
    },
  })
}

/**
 * 옵션 생성 Hook
 */
export function useCreateOption(): UseMutationResult<
  Option,
  ApiError,
  { data: OptionInsert; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useCreateOption] hook called')

  return useMutation({
    mutationFn: ({ data }) => createOption(data),
    onSuccess: (_, variables) => {
      console.log('[useCreateOption] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useCreateOption] onError', error)
    },
  })
}

/**
 * 옵션 수정 Hook
 */
export function useUpdateOption(): UseMutationResult<
  Option,
  ApiError,
  { id: string; data: OptionUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateOption] hook called')

  return useMutation({
    mutationFn: ({ id, data }) => updateOption(id, data),
    onSuccess: (_, variables) => {
      console.log('[useUpdateOption] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useUpdateOption] onError', error)
    },
  })
}

/**
 * 옵션 삭제 Hook
 */
export function useDeleteOption(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useDeleteOption] hook called')

  return useMutation({
    mutationFn: ({ id }) => deleteOption(id),
    onSuccess: (_, variables) => {
      console.log('[useDeleteOption] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.questions(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useDeleteOption] onError', error)
    },
  })
}

/**
 * 페이지 생성 Hook
 */
export function useCreateSurveyPage(): UseMutationResult<
  SurveyPage,
  ApiError,
  { data: SurveyPageInsert }
> {
  const queryClient = useQueryClient()
  console.log('[useCreateSurveyPage] hook called')

  return useMutation({
    mutationFn: ({ data }) => createSurveyPage(data),
    onSuccess: (data) => {
      console.log('[useCreateSurveyPage] onSuccess', { data })
      queryClient.invalidateQueries({ queryKey: surveyKeys.pages(data.survey_id) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.survey_id) })
    },
    onError: (error) => {
      console.error('[useCreateSurveyPage] onError', error)
    },
  })
}

/**
 * 페이지 수정 Hook
 */
export function useUpdateSurveyPage(): UseMutationResult<
  SurveyPage,
  ApiError,
  { id: string; data: SurveyPageUpdate; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateSurveyPage] hook called')

  return useMutation({
    mutationFn: ({ id, data }) => updateSurveyPage(id, data),
    onSuccess: (_, variables) => {
      console.log('[useUpdateSurveyPage] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.pages(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useUpdateSurveyPage] onError', error)
    },
  })
}

/**
 * 페이지 삭제 Hook
 */
export function useDeleteSurveyPage(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useDeleteSurveyPage] hook called')

  return useMutation({
    mutationFn: ({ id }) => deleteSurveyPage(id),
    onSuccess: (_, variables) => {
      console.log('[useDeleteSurveyPage] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.pages(variables.surveyId) })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useDeleteSurveyPage] onError', error)
    },
  })
}

/**
 * 접근 코드 생성 Hook
 */
export function useCreateAccessCode(): UseMutationResult<
  AccessCodeRow,
  ApiError,
  AccessCodeInsert
> {
  const queryClient = useQueryClient()
  console.log('[useCreateAccessCode] hook called')

  return useMutation({
    mutationFn: createAccessCode,
    onSuccess: (data) => {
      console.log('[useCreateAccessCode] onSuccess', { data })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(data.survey_id) })
    },
    onError: (error) => {
      console.error('[useCreateAccessCode] onError', error)
    },
  })
}

/**
 * 접근 코드 삭제 Hook
 */
export function useDeleteAccessCode(): UseMutationResult<
  void,
  ApiError,
  { id: string; surveyId: string }
> {
  const queryClient = useQueryClient()
  console.log('[useDeleteAccessCode] hook called')

  return useMutation({
    mutationFn: ({ id }) => deleteAccessCode(id),
    onSuccess: (_, variables) => {
      console.log('[useDeleteAccessCode] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useDeleteAccessCode] onError', error)
    },
  })
}

/**
 * 접근 코드 수정 Hook
 */
export function useUpdateAccessCode(): UseMutationResult<
  AccessCodeRow,
  ApiError,
  { id: string; surveyId: string; data: AccessCodeUpdate }
> {
  const queryClient = useQueryClient()
  console.log('[useUpdateAccessCode] hook called')

  return useMutation({
    mutationFn: ({ id, data }) => updateAccessCode(id, data),
    onSuccess: (_, variables) => {
      console.log('[useUpdateAccessCode] onSuccess', { variables })
      queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) })
    },
    onError: (error) => {
      console.error('[useUpdateAccessCode] onError', error)
    },
  })
}

export default {
  useSurveys,
  useSurveyDetail,
  useSurveyByCode,
  useQuestions,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useCreateOption,
  useUpdateOption,
  useDeleteOption,
  useCreateSurveyPage,
  useUpdateSurveyPage,
  useDeleteSurveyPage,
  useCreateAccessCode,
  useDeleteAccessCode,
  useUpdateAccessCode,
}
