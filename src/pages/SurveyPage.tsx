import { useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SurveyLayout, LoadingSpinner, Card, Button } from '@/components/common'
import { QuestionRenderer, ProgressBar, PageNavigator } from '@/components/survey'
import { useSurveyByCode, useSubmitSurveyResponse } from '@/hooks'
import { useResponseStore } from '@/stores/responseStore'
import type { Question, QuestionResponse } from '@/types'
import type { ResponseValue } from '@/components/survey'

// ============================================
// SurveyPage - Main Survey Form
// ============================================

export default function SurveyPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()

  // Store state
  const {
    respondentInfo,
    currentPage,
    responses,
    setCurrentPage,
    setResponse,
    setSurveyCode,
  } = useResponseStore()

  // Fetch survey data
  const { data: survey, isLoading, error: queryError } = useSurveyByCode(code)

  // Submit mutation
  const submitMutation = useSubmitSurveyResponse()

  // Mounted effect
  useEffect(() => {
    console.log('[SurveyPage] mounted')
  }, [])

  // Set survey code on mount
  useEffect(() => {
    if (code) {
      console.log('[SurveyPage] state changed', { surveyCode: code })
      setSurveyCode(code)
    }
  }, [code, setSurveyCode])

  // Log when survey data is loaded
  useEffect(() => {
    if (survey) {
      console.log('[SurveyPage] data loaded', { data: survey })
    }
  }, [survey])

  // Log query error
  useEffect(() => {
    if (queryError) {
      console.error('[SurveyPage] error', queryError)
    }
  }, [queryError])

  // Log currentPage changes
  useEffect(() => {
    console.log('[SurveyPage] state changed', { currentPage })
  }, [currentPage])

  // Get pages sorted by page_index
  const sortedPages = useMemo(() => {
    if (!survey?.pages) return []
    return [...survey.pages].sort((a, b) => a.page_index - b.page_index)
  }, [survey])

  // Check if we have pages or should use flat question list
  const hasPages = sortedPages.length > 0

  // Get all root questions (without parent) sorted by order_index
  // Include page break markers for page splitting
  const allSortedQuestions = useMemo(() => {
    if (!survey?.questions) return []
    return survey.questions
      .filter((q) => !q.parent_question_id)
      .sort((a, b) => a.order_index - b.order_index)
  }, [survey])

  // Group questions by page breaks
  const virtualPages = useMemo(() => {
    if (hasPages) return []

    const pages: { pageIndex: number; questions: Question[] }[] = []
    let currentPageQuestions: Question[] = []
    let pageIndex = 0

    allSortedQuestions.forEach((q) => {
      // 페이지 나눔 마커를 만나면 현재 페이지를 저장하고 새 페이지 시작
      if (q.content === '__PAGE_BREAK__' || q.is_page_break) {
        if (currentPageQuestions.length > 0) {
          pages.push({ pageIndex, questions: currentPageQuestions })
          pageIndex++
          currentPageQuestions = []
        }
      } else {
        currentPageQuestions.push(q)
      }
    })

    // 마지막 페이지 추가
    if (currentPageQuestions.length > 0) {
      pages.push({ pageIndex, questions: currentPageQuestions })
    }

    // 페이지가 없으면 빈 페이지 하나 추가
    if (pages.length === 0) {
      pages.push({ pageIndex: 0, questions: [] })
    }

    return pages
  }, [hasPages, allSortedQuestions])

  // Get all root questions excluding page breaks (for other uses)
  const allRootQuestions = useMemo(() => {
    return allSortedQuestions.filter(
      (q) => q.content !== '__PAGE_BREAK__' && !q.is_page_break
    )
  }, [allSortedQuestions])

  // Total number of pages (use virtual pages if no explicit pages)
  const totalPages = hasPages ? sortedPages.length : Math.max(virtualPages.length, 1)

  // Current page data
  const currentPageData = useMemo(() => {
    if (hasPages) {
      return sortedPages[currentPage] || null
    }
    return null // No explicit page data for virtual pages
  }, [hasPages, sortedPages, currentPage])

  // Get questions for current page (excluding conditional questions and page breaks)
  const currentPageQuestions = useMemo(() => {
    if (hasPages) {
      if (!currentPageData?.questions) return []
      return currentPageData.questions
        .filter((q) => !q.parent_question_id && q.content !== '__PAGE_BREAK__' && !q.is_page_break)
        .sort((a, b) => a.order_index - b.order_index)
    }

    // Virtual pages mode: get questions for current page_index
    const virtualPage = virtualPages[currentPage]
    if (!virtualPage) {
      // Fallback: show all questions on single page
      return allRootQuestions
    }
    return virtualPage.questions
  }, [hasPages, currentPageData, virtualPages, currentPage, allRootQuestions])

  // Get all questions (for mapping conditional questions)
  const allQuestions = useMemo(() => {
    if (!survey?.questions) return []
    return survey.questions
  }, [survey])

  // Get conditional questions for a parent question
  const getConditionalQuestions = useCallback(
    (parentQuestionId: string): Question[] => {
      return allQuestions.filter(
        (q) => q.parent_question_id === parentQuestionId
      )
    },
    [allQuestions]
  )

  // Handle response change
  const handleResponseChange = useCallback(
    (questionId: string, value: ResponseValue) => {
      console.log('[SurveyPage.handleResponseChange] called', { questionId, value })
      setResponse(questionId, value)
      console.log('[SurveyPage] state changed', { responses: { ...responses, [questionId]: value } })
    },
    [setResponse, responses]
  )

  // Validate current page responses
  const validateCurrentPage = useCallback((): boolean => {
    if (!currentPageQuestions) return true

    for (const question of currentPageQuestions) {
      if (question.is_required) {
        const response = responses[question.id]

        if (!response) return false

        // Check based on question type
        if (question.type === 'single' || question.type === 'multiple') {
          if (
            !response.selectedOptionIds ||
            response.selectedOptionIds.length === 0
          ) {
            return false
          }
        } else if (question.type === 'text') {
          if (
            !response.textResponses?.main ||
            response.textResponses.main.trim() === ''
          ) {
            return false
          }
        }
      }

      // Also check required conditional questions
      const conditionalQs = getConditionalQuestions(question.id)
      for (const condQ of conditionalQs) {
        if (condQ.is_required && condQ.trigger_option_ids) {
          const parentResponse = responses[question.id]
          const parentSelectedIds = parentResponse?.selectedOptionIds || []

          // Check if condition is triggered
          const isTriggered = condQ.trigger_option_ids.some((id) =>
            parentSelectedIds.includes(id)
          )

          if (isTriggered) {
            const condResponse = responses[condQ.id]
            if (!condResponse) return false

            if (condQ.type === 'single' || condQ.type === 'multiple') {
              if (
                !condResponse.selectedOptionIds ||
                condResponse.selectedOptionIds.length === 0
              ) {
                return false
              }
            } else if (condQ.type === 'text') {
              if (
                !condResponse.textResponses?.main ||
                condResponse.textResponses.main.trim() === ''
              ) {
                return false
              }
            }
          }
        }
      }
    }

    return true
  }, [currentPageQuestions, responses, getConditionalQuestions])

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    console.log('[SurveyPage.handlePrevious] called', { currentPage })
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      console.log('[SurveyPage] state changed', { currentPage: currentPage - 1 })
    }
  }, [currentPage, setCurrentPage])

  const handleNext = useCallback(() => {
    console.log('[SurveyPage.handleNext] called', { currentPage })
    if (validateCurrentPage() && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      console.log('[SurveyPage] state changed', { currentPage: currentPage + 1 })
    }
  }, [currentPage, totalPages, setCurrentPage, validateCurrentPage])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    console.log('[SurveyPage.handleSubmit] called', { responses, respondentInfo })
    if (!validateCurrentPage() || !survey) return

    // Build response payload
    const questionResponses: QuestionResponse[] = Object.entries(responses).map(
      ([questionId, value]) => ({
        questionId,
        selectedOptionIds: value.selectedOptionIds,
        textResponse: value.textResponses?.main,
        textResponses: value.textResponses,
      })
    )

    // Find access code id
    const accessCodeId = survey.access_codes?.find(
      (ac) => ac.code === code
    )?.id

    try {
      await submitMutation.mutateAsync({
        surveyId: survey.id,
        accessCodeId,
        respondentInfo: respondentInfo || undefined,
        responses: questionResponses,
      })

      // Navigate to complete page
      console.log('[SurveyPage] navigating to', '/complete')
      navigate('/complete')
    } catch (error) {
      console.error('[SurveyPage] error', error)
      // Could show an error toast here
    }
  }, [
    validateCurrentPage,
    survey,
    responses,
    code,
    respondentInfo,
    submitMutation,
    navigate,
  ])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (queryError || !survey) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              설문을 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              유효하지 않은 접속 코드이거나 설문이 종료되었습니다.
            </p>
            <Button variant="primary" onClick={() => {
              console.log('[SurveyPage] navigating to', '/')
              navigate('/')
            }}>
              처음으로
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // No questions state
  if (!survey?.questions || survey.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              설문 문항이 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              이 설문에는 아직 문항이 등록되지 않았습니다.
            </p>
            <Button variant="primary" onClick={() => {
              console.log('[SurveyPage] navigating to', '/')
              navigate('/')
            }}>
              처음으로
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === totalPages - 1
  const currentPageImage = currentPageData?.image_url

  return (
    <SurveyLayout
      imageUrl={currentPageImage || undefined}
      imageAlt={currentPageData?.title || '설문 이미지'}
      currentStep={currentPage + 1}
      totalSteps={totalPages}
      onPrevious={isFirstPage ? undefined : handlePrevious}
      onNext={isLastPage ? undefined : handleNext}
      isPreviousDisabled={submitMutation.isPending}
      isNextDisabled={!validateCurrentPage() || submitMutation.isPending}
      showNavigation={false}
    >
      <div className="h-full flex flex-col">
        {/* Page Title */}
        {currentPageData?.title && (
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentPageData.title}
          </h2>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar current={currentPage + 1} total={totalPages} />
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto">
          {currentPageQuestions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              options={question.options || []}
              response={responses[question.id] || {}}
              onResponseChange={(value) =>
                handleResponseChange(question.id, value)
              }
              conditionalQuestions={getConditionalQuestions(question.id)}
              questionNumber={index + 1}
            />
          ))}
        </div>

        {/* Page Navigator */}
        <PageNavigator
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    </SurveyLayout>
  )
}
