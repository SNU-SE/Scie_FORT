// ============================================
// Survey Platform - Admin Survey Edit Page
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Modal, AdminLayout, LoadingSpinner } from '@/components/common'
import {
  SurveyForm,
  RespondentFieldsEditor,
  QuestionList,
  QuestionEditor,
  ConditionEditor,
  CodeManager,
} from '@/components/admin'
import {
  useSurveyDetail,
  useCreateSurvey,
  useUpdateSurvey,
  useCreateQuestion,
  useUpdateQuestion,
  useCreateAccessCode,
  useUpdateAccessCode,
  useDeleteAccessCode,
  useAuth,
} from '@/hooks'
import { useSurveyStore } from '@/stores/surveyStore'
import type { Survey, Question, RespondentField } from '@/types'

// 임시 ID 생성 (클라이언트 사이드)
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export default function SurveyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isNew = id === 'new'

  // Store
  const {
    survey,
    questions,
    selectedQuestionId,
    isQuestionEditorOpen,
    isConditionEditorOpen,
    conditionParentQuestion,
    conditionParentOptions,
    editingConditionalQuestion,
    setSurvey,
    setQuestions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    reorderQuestions,
    selectQuestion,
    openQuestionEditor,
    closeQuestionEditor,
    closeConditionEditor,
    openConditionEditor,
    resetStore,
  } = useSurveyStore()

  // API hooks
  const { data: surveyData, isLoading } = useSurveyDetail(isNew ? undefined : id)
  const createSurveyMutation = useCreateSurvey()
  const updateSurveyMutation = useUpdateSurvey()
  const createQuestionMutation = useCreateQuestion()
  const updateQuestionMutation = useUpdateQuestion()
  const createAccessCodeMutation = useCreateAccessCode()
  const updateAccessCodeMutation = useUpdateAccessCode()
  const deleteAccessCodeMutation = useDeleteAccessCode()

  // Local state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Mounted effect
  useEffect(() => {
    console.log('[SurveyEditPage] mounted')
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    if (isNew) {
      console.log('[SurveyEditPage] state changed', { isNew: true, initializing: true })
      // 새 설문 초기화
      setSurvey({
        title: '',
        description: '',
        is_active: true,
        collect_respondent_info: false,
        respondent_fields: [],
      })
      setQuestions([])
    } else if (surveyData) {
      console.log('[SurveyEditPage] data loaded', { data: surveyData })
      // 기존 설문 데이터 로드
      setSurvey(surveyData)
      setQuestions(surveyData.questions || [])
    }

    // 컴포넌트 언마운트 시 스토어 초기화
    return () => {
      resetStore()
    }
  }, [isNew, surveyData, setSurvey, setQuestions, resetStore])

  // 선택된 문항 찾기
  const selectedQuestion = selectedQuestionId
    ? questions.find((q) => q.id === selectedQuestionId) || null
    : null

  // Survey 업데이트 핸들러
  const handleSurveyUpdate = useCallback((updates: Partial<Survey>) => {
    console.log('[SurveyEditPage.handleSurveyUpdate] called', { updates, currentSurvey: survey })
    // survey가 null이면 기본값으로 초기화
    const baseSurvey = survey || {
      title: '',
      description: '',
      is_active: true,
      collect_respondent_info: false,
      respondent_fields: [],
    }
    const updatedSurvey = { ...baseSurvey, ...updates }
    setSurvey(updatedSurvey)
    console.log('[SurveyEditPage] state changed', { survey: updatedSurvey })
  }, [survey, setSurvey])

  // 인적정보 필드 업데이트
  const handleRespondentFieldsChange = useCallback((fields: RespondentField[]) => {
    console.log('[SurveyEditPage.handleRespondentFieldsChange] called', { fields })
    if (survey) {
      setSurvey({ ...survey, respondent_fields: fields })
      console.log('[SurveyEditPage] state changed', { respondent_fields: fields })
    }
  }, [survey, setSurvey])

  // 문항 추가
  const handleAddQuestion = useCallback(() => {
    console.log('[SurveyEditPage.handleAddQuestion] called')
    const newQuestion: Question = {
      id: generateTempId(),
      survey_id: survey?.id || '',
      page_index: 0,
      order_index: questions.length,
      type: 'single',
      content: '',
      is_required: false,
      parent_question_id: null,
      trigger_option_ids: null,
      created_at: new Date().toISOString(),
      options: [],
      image_url: null,
      image_position: 'left',
      is_page_break: false,
    }
    addQuestion(newQuestion)
    selectQuestion(newQuestion.id)
    openQuestionEditor()
    console.log('[SurveyEditPage] state changed', { newQuestion, isQuestionEditorOpen: true })
  }, [survey, questions.length, addQuestion, selectQuestion, openQuestionEditor])

  // 페이지 나눔 추가
  const handleAddPageBreak = useCallback((afterIndex: number) => {
    console.log('[SurveyEditPage.handleAddPageBreak] called', { afterIndex })
    const newQuestion: Question = {
      id: generateTempId(),
      survey_id: survey?.id || '',
      page_index: questions.filter((q) => q.type === 'single' && q.content === '__PAGE_BREAK__').length + 1,
      order_index: afterIndex + 1,
      type: 'single',
      content: '__PAGE_BREAK__',
      is_required: false,
      parent_question_id: null,
      trigger_option_ids: null,
      created_at: new Date().toISOString(),
      options: [],
      image_url: null,
      image_position: 'left',
      is_page_break: true,
    }
    addQuestion(newQuestion)
    console.log('[SurveyEditPage] state changed', { pageBreakAdded: true })
  }, [survey, questions, addQuestion])

  // 문항 편집
  const handleEditQuestion = useCallback((questionId: string) => {
    console.log('[SurveyEditPage.handleEditQuestion] called', { questionId })
    selectQuestion(questionId)
    openQuestionEditor()
    console.log('[SurveyEditPage] state changed', { selectedQuestionId: questionId, isQuestionEditorOpen: true })
  }, [selectQuestion, openQuestionEditor])

  // 문항 저장 (에디터에서)
  const handleSaveQuestion = useCallback((updatedQuestion: Question, options: import('@/types').Option[]) => {
    console.log('[SurveyEditPage.handleSaveQuestion] called', { updatedQuestion, options })
    // options를 question에 포함시켜 저장
    const questionWithOptions = { ...updatedQuestion, options }
    updateQuestion(updatedQuestion.id, questionWithOptions)
    closeQuestionEditor()
    console.log('[SurveyEditPage] state changed', { questionSaved: true, isQuestionEditorOpen: false })
  }, [updateQuestion, closeQuestionEditor])

  // 조건 추가 핸들러 (문항 편집 중 선택지에서 호출)
  const handleAddCondition = useCallback((optionId: string, currentOptions: import('@/types').Option[]) => {
    console.log('[SurveyEditPage.handleAddCondition] called', { optionId, currentOptions })
    if (!selectedQuestion) return

    // QuestionEditor에서 전달받은 현재 옵션들 사용
    const parentOptions = currentOptions || []

    // 조건 편집기 열기
    openConditionEditor(selectedQuestion, parentOptions)
    console.log('[SurveyEditPage] state changed', { isConditionEditorOpen: true })
  }, [selectedQuestion, openConditionEditor])

  // 문항 삭제
  const handleDeleteQuestion = useCallback((questionId: string) => {
    console.log('[SurveyEditPage.handleDeleteQuestion] called', { questionId })
    if (confirm('이 문항을 삭제하시겠습니까?')) {
      removeQuestion(questionId)
      console.log('[SurveyEditPage] state changed', { questionDeleted: questionId })
    }
  }, [removeQuestion])

  // 조건부 질문 편집 (기존 조건 수정)
  const handleEditCondition = useCallback((conditionalQuestion: Question) => {
    console.log('[SurveyEditPage.handleEditCondition] called', { conditionalQuestion })

    // 부모 질문 찾기
    const parentQuestion = questions.find(q => q.id === conditionalQuestion.parent_question_id)
    if (!parentQuestion) {
      console.error('[SurveyEditPage.handleEditCondition] parent question not found')
      return
    }

    // 부모 질문의 옵션 가져오기
    const parentOptions = parentQuestion.options || []

    // ConditionEditor 열기 (기존 조건부 질문 포함)
    openConditionEditor(parentQuestion, parentOptions, conditionalQuestion)
    console.log('[SurveyEditPage] state changed', { isConditionEditorOpen: true, editingConditionalQuestion: conditionalQuestion })
  }, [questions, openConditionEditor])

  // 조건 저장
  const handleSaveCondition = useCallback((question: Question, triggerOptionIds: string[]) => {
    console.log('[SurveyEditPage.handleSaveCondition] called', { questionId: question.id, triggerOptionIds })

    // 조건부 문항에 trigger_option_ids 설정
    const conditionalQuestion = {
      ...question,
      trigger_option_ids: triggerOptionIds,
    }

    // 기존 문항인지 새 문항인지 확인
    const existingQuestion = questions.find((q) => q.id === question.id)
    if (existingQuestion) {
      // 기존 문항 업데이트
      updateQuestion(question.id, conditionalQuestion)
    } else {
      // 새 조건부 문항 추가
      addQuestion(conditionalQuestion)
    }

    closeConditionEditor()
    console.log('[SurveyEditPage] state changed', { conditionSaved: true, isConditionEditorOpen: false })
  }, [questions, updateQuestion, addQuestion, closeConditionEditor])

  // 설문 저장
  const handleSave = async () => {
    console.log('[SurveyEditPage.handleSave] called', { survey, questions, user })

    if (!survey) {
      setSaveError('설문 정보가 없습니다. 페이지를 새로고침해주세요.')
      console.error('[SurveyEditPage.handleSave] survey is null')
      return
    }

    if (!user) {
      setSaveError('로그인이 필요합니다. 다시 로그인해주세요.')
      console.error('[SurveyEditPage.handleSave] user is null - authentication required')
      return
    }

    if (!survey.title?.trim()) {
      setSaveError('설문 제목을 입력해주세요.')
      return
    }

    setIsSaving(true)
    console.log('[SurveyEditPage] state changed', { isSaving: true })
    setSaveError(null)

    try {
      let savedSurveyId = survey.id
      const shouldCreateNew = isNew || !survey.id
      console.log('[SurveyEditPage.handleSave] starting save', { isNew, surveyId: savedSurveyId, shouldCreateNew })

      if (shouldCreateNew) {
        // 새 설문 생성
        console.log('[SurveyEditPage.handleSave] creating new survey...')
        const surveyData = {
          title: survey.title!,
          description: survey.description || null,
          user_id: user.id,
          is_active: survey.is_active || false,
          collect_respondent_info: survey.collect_respondent_info || false,
          respondent_fields: survey.respondent_fields || null,
        }
        console.log('[SurveyEditPage.handleSave] survey data to create', surveyData)

        const createdSurvey = await createSurveyMutation.mutateAsync(surveyData)
        savedSurveyId = createdSurvey.id
        console.log('[SurveyEditPage.handleSave] survey created', { createdSurvey })

        // URL 변경 (새 설문 -> 실제 ID)
        console.log('[SurveyEditPage] navigating to', `/admin/survey/${savedSurveyId}`)
        navigate(`/admin/survey/${savedSurveyId}`, { replace: true })
      } else if (survey.id) {
        // 기존 설문 업데이트
        await updateSurveyMutation.mutateAsync({
          id: survey.id,
          data: {
            title: survey.title,
            description: survey.description,
            is_active: survey.is_active,
            collect_respondent_info: survey.collect_respondent_info,
            respondent_fields: survey.respondent_fields,
          },
        })
        console.log('[SurveyEditPage] data loaded', { surveyUpdated: true })
      }

      // 문항 저장 처리
      if (savedSurveyId) {
        // temp ID -> real ID 매핑
        const questionIdMap = new Map<string, string>()
        const optionIdMap = new Map<string, string>()

        // 1단계: 일반 질문 (parent_question_id가 없는 질문) 먼저 저장
        const regularQuestions = questions.filter(q => !q.parent_question_id)
        const conditionalQuestions = questions.filter(q => q.parent_question_id)

        console.log('[SurveyEditPage.handleSave] separating questions', {
          regular: regularQuestions.length,
          conditional: conditionalQuestions.length,
        })

        for (const question of regularQuestions) {
          const isPageBreak = question.content === '__PAGE_BREAK__'

          if (question.id.startsWith('temp_')) {
            // 새 문항 생성 (옵션 포함)
            const questionOptions = question.options?.map((opt, idx) => ({
              content: opt.content,
              order_index: opt.order_index ?? idx,
              allows_text_input: opt.allows_text_input ?? false,
            }))

            console.log('[SurveyEditPage.handleSave] creating regular question', {
              tempId: question.id,
              question: question.content,
              optionsCount: questionOptions?.length ?? 0,
            })

            const createdQuestion = await createQuestionMutation.mutateAsync({
              data: {
                survey_id: savedSurveyId,
                page_index: question.page_index,
                order_index: question.order_index,
                type: question.type,
                content: question.content,
                is_required: question.is_required,
                image_url: question.image_url,
                image_position: question.image_position,
                parent_question_id: null,
                trigger_option_ids: null,
              },
              options: questionOptions,
            })

            // ID 매핑 저장
            questionIdMap.set(question.id, createdQuestion.id)
            console.log('[SurveyEditPage.handleSave] question ID mapped', {
              tempId: question.id,
              realId: createdQuestion.id,
            })

            // 옵션 ID 매핑 저장
            if (question.options && createdQuestion.options) {
              question.options.forEach((tempOpt, idx) => {
                const realOpt = createdQuestion.options?.[idx]
                if (realOpt && tempOpt.id.startsWith('temp_')) {
                  optionIdMap.set(tempOpt.id, realOpt.id)
                  console.log('[SurveyEditPage.handleSave] option ID mapped', {
                    tempId: tempOpt.id,
                    realId: realOpt.id,
                  })
                }
              })
            }
          } else if (!isPageBreak) {
            // 기존 문항 업데이트
            await updateQuestionMutation.mutateAsync({
              id: question.id,
              surveyId: savedSurveyId,
              data: {
                page_index: question.page_index,
                order_index: question.order_index,
                type: question.type,
                content: question.content,
                is_required: question.is_required,
                image_url: question.image_url,
                image_position: question.image_position,
                parent_question_id: null,
                trigger_option_ids: null,
              },
            })
            // 기존 질문은 ID가 그대로 유지됨
            questionIdMap.set(question.id, question.id)
            // 기존 옵션도 ID 그대로 유지
            question.options?.forEach(opt => {
              if (!opt.id.startsWith('temp_')) {
                optionIdMap.set(opt.id, opt.id)
              }
            })
          }
        }

        // 2단계: 조건부 질문 저장 (매핑된 ID 사용)
        for (const question of conditionalQuestions) {
          // parent_question_id 매핑
          const realParentId = question.parent_question_id?.startsWith('temp_')
            ? questionIdMap.get(question.parent_question_id)
            : question.parent_question_id

          // trigger_option_ids 매핑
          const realTriggerOptionIds = question.trigger_option_ids?.map(optId =>
            optId.startsWith('temp_') ? optionIdMap.get(optId) || optId : optId
          ).filter(Boolean) as string[] | null

          console.log('[SurveyEditPage.handleSave] processing conditional question', {
            tempId: question.id,
            originalParentId: question.parent_question_id,
            realParentId,
            originalTriggerOptionIds: question.trigger_option_ids,
            realTriggerOptionIds,
          })

          if (question.id.startsWith('temp_')) {
            // 새 조건부 문항 생성
            const questionOptions = question.options?.map((opt, idx) => ({
              content: opt.content,
              order_index: opt.order_index ?? idx,
              allows_text_input: opt.allows_text_input ?? false,
            }))

            await createQuestionMutation.mutateAsync({
              data: {
                survey_id: savedSurveyId,
                page_index: question.page_index,
                order_index: question.order_index,
                type: question.type,
                content: question.content,
                is_required: question.is_required,
                image_url: question.image_url,
                image_position: question.image_position,
                parent_question_id: realParentId || null,
                trigger_option_ids: realTriggerOptionIds,
              },
              options: questionOptions,
            })
          } else {
            // 기존 조건부 문항 업데이트
            await updateQuestionMutation.mutateAsync({
              id: question.id,
              surveyId: savedSurveyId,
              data: {
                page_index: question.page_index,
                order_index: question.order_index,
                type: question.type,
                content: question.content,
                is_required: question.is_required,
                image_url: question.image_url,
                image_position: question.image_position,
                parent_question_id: realParentId || null,
                trigger_option_ids: realTriggerOptionIds,
              },
            })
          }
        }
      }

      alert('설문이 저장되었습니다.')
    } catch (err) {
      console.error('[SurveyEditPage] error', err)
      setSaveError(err instanceof Error ? err.message : '설문 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
      console.log('[SurveyEditPage] state changed', { isSaving: false })
    }
  }

  // 취소
  const handleCancel = () => {
    console.log('[SurveyEditPage.handleCancel] called')
    if (confirm('저장하지 않은 변경사항이 있을 수 있습니다. 정말 나가시겠습니까?')) {
      console.log('[SurveyEditPage] navigating to', '/admin/dashboard')
      navigate('/admin/dashboard')
    }
  }

  // 접근 코드 생성
  const handleGenerateCode = useCallback(async () => {
    if (!survey?.id) return
    console.log('[SurveyEditPage.handleGenerateCode] called')

    // 랜덤 코드 생성 (6자리 영숫자)
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    try {
      await createAccessCodeMutation.mutateAsync({
        survey_id: survey.id,
        code: randomCode,
        is_active: true,
      })
      console.log('[SurveyEditPage.handleGenerateCode] success', { code: randomCode })
    } catch (error) {
      console.error('[SurveyEditPage.handleGenerateCode] error', error)
      alert('코드 생성에 실패했습니다.')
    }
  }, [survey?.id, createAccessCodeMutation])

  // 접근 코드 활성/비활성 토글
  const handleToggleActive = useCallback(async (codeId: string) => {
    if (!survey?.id) return
    console.log('[SurveyEditPage.handleToggleActive] called', { codeId })

    const code = survey.access_codes?.find(c => c.id === codeId)
    if (!code) return

    try {
      await updateAccessCodeMutation.mutateAsync({
        id: codeId,
        surveyId: survey.id,
        data: { is_active: !code.is_active },
      })
      console.log('[SurveyEditPage.handleToggleActive] success', { codeId, newStatus: !code.is_active })
    } catch (error) {
      console.error('[SurveyEditPage.handleToggleActive] error', error)
      alert('코드 상태 변경에 실패했습니다.')
    }
  }, [survey?.id, survey?.access_codes, updateAccessCodeMutation])

  // 접근 코드 삭제
  const handleDeleteCode = useCallback(async (codeId: string) => {
    if (!survey?.id) return
    console.log('[SurveyEditPage.handleDeleteCode] called', { codeId })

    if (!confirm('이 접근 코드를 삭제하시겠습니까?')) return

    try {
      await deleteAccessCodeMutation.mutateAsync({
        id: codeId,
        surveyId: survey.id,
      })
      console.log('[SurveyEditPage.handleDeleteCode] success', { codeId })
    } catch (error) {
      console.error('[SurveyEditPage.handleDeleteCode] error', error)
      alert('코드 삭제에 실패했습니다.')
    }
  }, [survey?.id, deleteAccessCodeMutation])

  // 로그아웃 핸들러
  const handleLogout = async () => {
    console.log('[SurveyEditPage.handleLogout] called')
    await logout()
    navigate('/admin/login')
  }

  // 로딩 중
  if (!isNew && isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="p-6">
        {/* 에러 메시지 */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}

        {/* 2단 레이아웃 */}
        <div className="flex gap-6">
          {/* 좌측 패널 (40%) */}
          <div className="w-2/5 space-y-6">
            {/* 설문 기본 정보 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                설문 기본 정보
              </h2>
              <SurveyForm
                survey={survey}
                onChange={handleSurveyUpdate}
              />
            </div>

            {/* 인적정보 수집 설정 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                인적정보 수집
              </h2>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={survey?.collect_respondent_info || false}
                    onChange={(e) => handleSurveyUpdate({ collect_respondent_info: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">인적정보 수집 활성화</span>
                </label>
              </div>
              {survey?.collect_respondent_info && (
                <RespondentFieldsEditor
                  fields={survey.respondent_fields || []}
                  onChange={handleRespondentFieldsChange}
                />
              )}
            </div>

            {/* 접속 코드 관리 */}
            {!isNew && survey?.id && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  접속 코드 관리
                </h2>
                <CodeManager
                  codes={survey.access_codes || []}
                  onGenerate={handleGenerateCode}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteCode}
                />
              </div>
            )}
          </div>

          {/* 우측 패널 (60%) */}
          <div className="w-3/5">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                문항 목록
              </h2>

              {/* 문항 리스트 */}
              <QuestionList
                questions={questions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onReorder={reorderQuestions}
                onAddPageBreak={handleAddPageBreak}
                onEditCondition={handleEditCondition}
              />

              {/* 문항 추가 버튼들 */}
              <div className="mt-4 flex gap-2">
                <Button onClick={handleAddQuestion}>
                  + 문항 추가
                </Button>
                <Button variant="outline" onClick={() => handleAddPageBreak(questions.length)}>
                  + 페이지 나눔
                </Button>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 문항 편집 모달 */}
      <Modal
        isOpen={isQuestionEditorOpen}
        onClose={closeQuestionEditor}
        title="문항 편집"
        size="lg"
      >
        {selectedQuestion && (
          <QuestionEditor
            question={selectedQuestion}
            options={selectedQuestion.options || []}
            onSave={handleSaveQuestion}
            onCancel={closeQuestionEditor}
            onAddCondition={handleAddCondition}
          />
        )}
      </Modal>

      {/* 조건 편집 모달 */}
      <Modal
        isOpen={isConditionEditorOpen}
        onClose={closeConditionEditor}
        title={editingConditionalQuestion ? '조건부 질문 수정' : '조건 설정'}
      >
        {conditionParentQuestion && (
          <ConditionEditor
            parentQuestion={conditionParentQuestion}
            parentOptions={conditionParentOptions}
            conditionalQuestion={editingConditionalQuestion || undefined}
            onSave={handleSaveCondition}
            onCancel={closeConditionEditor}
          />
        )}
      </Modal>
    </AdminLayout>
  )
}
