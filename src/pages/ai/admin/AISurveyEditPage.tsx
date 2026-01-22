// ============================================
// AI Survey Platform - AI Survey Edit Page
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Button, Modal, LoadingSpinner, Input, Card } from '@/components/common'
import {
  useAISurveyDetail,
  useCreateAISurvey,
  useUpdateAISurvey,
  useCreateAIQuestion,
  useUpdateAIQuestion,
  useDeleteAIQuestion,
  useCreateAIAccessCode,
  useDeleteAIAccessCode,
  useAuth,
} from '@/hooks'
import { useAISurveyStore } from '@/stores/aiSurveyStore'
import type {
  AIQuestion,
  AIOption,
  AIQuestionType,
} from '@/types/ai'

// Question type labels
const questionTypeLabels: Record<AIQuestionType, string> = {
  text: '서술형',
  multiple_choice: '객관식',
  both: '객관식 + 서술형',
}

export default function AISurveyEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const { user, isLoading: authLoading, logout } = useAuth()

  // 인증 체크: 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin')
    }
  }, [user, authLoading, navigate])

  // Store
  const {
    survey,
    questions,
    isQuestionEditorOpen,
    setSurvey,
    setQuestions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    selectQuestion,
    openQuestionEditor,
    closeQuestionEditor,
    resetStore,
  } = useAISurveyStore()

  // Query
  const { data: surveyData, isLoading, error } = useAISurveyDetail(isNew ? undefined : id)

  // Mutations
  const createSurveyMutation = useCreateAISurvey()
  const updateSurveyMutation = useUpdateAISurvey()
  const createQuestionMutation = useCreateAIQuestion()
  const updateQuestionMutation = useUpdateAIQuestion()
  const deleteQuestionMutation = useDeleteAIQuestion()
  const createAccessCodeMutation = useCreateAIAccessCode()
  const deleteAccessCodeMutation = useDeleteAIAccessCode()

  // Local state
  const [isSaving, setIsSaving] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [newCode, setNewCode] = useState('')

  // 편집 중인 질문 상태
  const [editingQuestion, setEditingQuestion] = useState<Partial<AIQuestion> | null>(null)

  // Load survey data
  useEffect(() => {
    if (surveyData) {
      setSurvey(surveyData)
      setQuestions(surveyData.questions || [])
    } else if (isNew && user) {
      setSurvey({
        title: '',
        description: '',
        system_prompt: '너는 학생들에게 과학 문제를 출제하고 친근하게 설명해주는 AI 선생님이야. 학생이 답을 틀리면 힌트를 주고, 맞추면 칭찬해줘.',
        allow_hint: true,
        max_hints_per_question: 3,
        is_active: true,
        user_id: user.id,
      })
      setQuestions([])
    }
  }, [surveyData, isNew, user, setSurvey, setQuestions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetStore()
    }
  }, [resetStore])

  // Handlers - Survey
  const handleSaveSurvey = async () => {
    if (!survey || !user) return

    setIsSaving(true)
    try {
      if (isNew) {
        const newSurvey = await createSurveyMutation.mutateAsync({
          ...survey,
          user_id: user.id,
          title: survey.title || '새 AI 설문',
        } as any)
        navigate(`/admin/ai/survey/${newSurvey.id}`, { replace: true })
      } else {
        await updateSurveyMutation.mutateAsync({
          id: id!,
          data: {
            title: survey.title,
            description: survey.description,
            system_prompt: survey.system_prompt,
            allow_hint: survey.allow_hint,
            max_hints_per_question: survey.max_hints_per_question,
            is_active: survey.is_active,
          },
        })
      }
      alert('저장되었습니다.')
    } catch (err) {
      console.error('Save error:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handlers - Question
  const handleAddQuestion = () => {
    setEditingQuestion({
      survey_id: id,
      order_index: questions.length,
      question_text: '',
      question_type: 'multiple_choice',
      question_image_url: null,
      correct_answer: null,
      evaluation_prompt: '학생의 답변을 평가해줘. 맞으면 칭찬하고, 틀리면 왜 틀렸는지 친절하게 설명해줘.',
      hint_prompt: '학생에게 힌트를 줘. 답을 직접 알려주지 말고, 생각할 수 있는 방향을 제시해줘.',
      auto_progress: false,
      options: [],
    })
    openQuestionEditor()
  }

  const handleEditQuestion = (question: AIQuestion) => {
    setEditingQuestion({ ...question })
    selectQuestion(question.id)
    openQuestionEditor()
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !id) return

    setIsSaving(true)
    try {
      if (editingQuestion.id) {
        // Update existing question
        await updateQuestionMutation.mutateAsync({
          id: editingQuestion.id,
          data: {
            question_text: editingQuestion.question_text,
            question_type: editingQuestion.question_type,
            question_image_url: editingQuestion.question_image_url,
            correct_answer: editingQuestion.correct_answer,
            evaluation_prompt: editingQuestion.evaluation_prompt,
            hint_prompt: editingQuestion.hint_prompt,
            auto_progress: editingQuestion.auto_progress,
            order_index: editingQuestion.order_index,
          },
          surveyId: id,
        })
        updateQuestion(editingQuestion.id, editingQuestion as any)
      } else {
        // Create new question
        const options = editingQuestion.options?.map((opt, idx) => ({
          option_text: opt.option_text,
          order_index: idx,
          is_correct: opt.is_correct || false,
        })) || []

        const newQuestion = await createQuestionMutation.mutateAsync({
          data: {
            survey_id: id,
            order_index: editingQuestion.order_index || questions.length,
            question_text: editingQuestion.question_text || '',
            question_type: editingQuestion.question_type || 'multiple_choice',
            question_image_url: editingQuestion.question_image_url,
            correct_answer: editingQuestion.correct_answer,
            evaluation_prompt: editingQuestion.evaluation_prompt,
            hint_prompt: editingQuestion.hint_prompt,
            auto_progress: editingQuestion.auto_progress || false,
          },
          options,
        })
        addQuestion(newQuestion)
      }
      closeQuestionEditor()
      setEditingQuestion(null)
    } catch (err) {
      console.error('Save question error:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return

    try {
      await deleteQuestionMutation.mutateAsync({ id: questionId, surveyId: id! })
      removeQuestion(questionId)
    } catch (err) {
      console.error('Delete question error:', err)
      alert('삭제에 실패했습니다.')
    }
  }

  // Handlers - Option
  const handleAddOption = () => {
    if (!editingQuestion) return
    const options = editingQuestion.options || []
    setEditingQuestion({
      ...editingQuestion,
      options: [
        ...options,
        {
          id: `temp-${Date.now()}`,
          question_id: editingQuestion.id || '',
          order_index: options.length,
          option_text: '',
          is_correct: false,
        },
      ],
    })
  }

  const handleUpdateOption = (optionId: string, updates: Partial<AIOption>) => {
    if (!editingQuestion) return
    setEditingQuestion({
      ...editingQuestion,
      options: editingQuestion.options?.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    })
  }

  const handleDeleteOption = (optionId: string) => {
    if (!editingQuestion) return
    setEditingQuestion({
      ...editingQuestion,
      options: editingQuestion.options?.filter(opt => opt.id !== optionId),
    })
  }

  // Handlers - Access Code
  const handleCreateAccessCode = async () => {
    if (!id || !newCode.trim()) return

    try {
      await createAccessCodeMutation.mutateAsync({
        survey_id: id,
        code: newCode.trim(),
        is_active: true,
      })
      setNewCode('')
      setShowCodeModal(false)
    } catch (err) {
      console.error('Create access code error:', err)
      alert('접속 코드 생성에 실패했습니다.')
    }
  }

  const handleDeleteAccessCode = async (codeId: string) => {
    if (!confirm('이 접속 코드를 삭제하시겠습니까?')) return

    try {
      await deleteAccessCodeMutation.mutateAsync({ id: codeId, surveyId: id! })
    } catch (err) {
      console.error('Delete access code error:', err)
      alert('삭제에 실패했습니다.')
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(code)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  // 인증 로딩 중이거나 인증되지 않은 경우
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !isNew) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">설문을 불러오는데 실패했습니다.</p>
          <Button onClick={() => navigate('/admin/ai/dashboard')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/ai/dashboard" className="text-gray-500 hover:text-gray-700">
              &larr; 목록
            </Link>
            <span className="text-xl font-bold text-gray-900">
              {isNew ? '새 AI 설문' : 'AI 설문 편집'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
            <Button onClick={handleSaveSurvey} disabled={isSaving}>
              {isSaving ? '저장 중...' : '설문 저장'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 기본 정보 */}
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">기본 정보</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <Input
                value={survey?.title || ''}
                onChange={(value) => setSurvey({ ...survey, title: value })}
                placeholder="AI 설문 제목"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={survey?.description || ''}
                onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
                placeholder="설문에 대한 설명"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={survey?.is_active || false}
                  onChange={(e) => setSurvey({ ...survey, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={survey?.allow_hint || false}
                  onChange={(e) => setSurvey({ ...survey, allow_hint: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">힌트 허용</span>
              </label>

              {survey?.allow_hint && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">문제당 최대 힌트 수:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={survey?.max_hints_per_question || 3}
                    onChange={(e) => setSurvey({ ...survey, max_hints_per_question: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 시스템 프롬프트 */}
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">AI 시스템 프롬프트</h2>
            <p className="text-sm text-gray-500">AI가 학생과 대화할 때 기본적으로 따르는 지시사항입니다.</p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={survey?.system_prompt || ''}
              onChange={(e) => setSurvey({ ...survey, system_prompt: e.target.value })}
              placeholder="시스템 프롬프트를 입력하세요..."
              rows={6}
            />
          </div>
        </Card>

        {/* 문제 목록 */}
        {!isNew && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">문제 목록 ({questions.length}개)</h2>
                <Button onClick={handleAddQuestion}>+ 문제 추가</Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 추가된 문제가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, idx) => (
                    <div
                      key={question.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-500">Q{idx + 1}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                              {questionTypeLabels[question.question_type]}
                            </span>
                          </div>
                          <p className="text-gray-800">{question.question_text}</p>
                          {question.question_type !== 'text' && question.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.options.map((opt, optIdx) => (
                                <span
                                  key={opt.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    opt.is_correct
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt.option_text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            편집
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 접속 코드 */}
        {!isNew && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">접속 코드</h2>
                <Button onClick={() => setShowCodeModal(true)}>+ 코드 생성</Button>
              </div>

              {surveyData?.access_codes && surveyData.access_codes.length > 0 ? (
                <div className="space-y-2">
                  {surveyData.access_codes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-mono font-bold text-blue-600">
                          {code.code}
                        </code>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            code.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {code.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccessCode(code.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  아직 생성된 접속 코드가 없습니다.
                </div>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Question Editor Modal */}
      <Modal
        isOpen={isQuestionEditorOpen}
        onClose={() => {
          closeQuestionEditor()
          setEditingQuestion(null)
        }}
        title={editingQuestion?.id ? '문제 편집' : '새 문제 추가'}
      >
        {editingQuestion && (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 문제 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingQuestion.question_type || 'multiple_choice'}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    question_type: e.target.value as AIQuestionType,
                  })
                }
              >
                <option value="multiple_choice">객관식</option>
                <option value="text">서술형</option>
                <option value="both">객관식 + 서술형</option>
              </select>
            </div>

            {/* 문제 텍스트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문제 내용</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingQuestion.question_text || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                }
                placeholder="문제 내용을 입력하세요"
                rows={3}
              />
            </div>

            {/* 문제 이미지 URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL (선택)</label>
              <Input
                value={editingQuestion.question_image_url || ''}
                onChange={(value) =>
                  setEditingQuestion({ ...editingQuestion, question_image_url: value || null })
                }
                placeholder="https://example.com/image.png"
              />
            </div>

            {/* 선택지 (객관식인 경우) */}
            {editingQuestion.question_type !== 'text' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">선택지</label>
                  <Button variant="ghost" size="sm" onClick={handleAddOption}>
                    + 선택지 추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingQuestion.options?.map((option, idx) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Input
                        value={option.option_text}
                        onChange={(value) =>
                          handleUpdateOption(option.id, { option_text: value })
                        }
                        placeholder="선택지 내용"
                        className="flex-1"
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) =>
                            handleUpdateOption(option.id, { is_correct: e.target.checked })
                          }
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-500">정답</span>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOption(option.id)}
                        className="text-red-600"
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 정답 (서술형인 경우) */}
            {editingQuestion.question_type !== 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  모범 답안 (선택)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingQuestion.correct_answer || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value || null })
                  }
                  placeholder="AI가 참고할 모범 답안"
                  rows={2}
                />
              </div>
            )}

            {/* 평가 프롬프트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">평가 프롬프트</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                value={editingQuestion.evaluation_prompt || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, evaluation_prompt: e.target.value })
                }
                placeholder="학생 답변 평가 시 AI에게 주어지는 지시사항"
                rows={3}
              />
            </div>

            {/* 힌트 프롬프트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">힌트 프롬프트</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                value={editingQuestion.hint_prompt || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, hint_prompt: e.target.value })
                }
                placeholder="힌트 제공 시 AI에게 주어지는 지시사항"
                rows={3}
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  closeQuestionEditor()
                  setEditingQuestion(null)
                }}
              >
                취소
              </Button>
              <Button onClick={handleSaveQuestion} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Access Code Modal */}
      <Modal
        isOpen={showCodeModal}
        onClose={() => {
          setShowCodeModal(false)
          setNewCode('')
        }}
        title="접속 코드 생성"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">접속 코드</label>
            <div className="flex gap-2">
              <Input
                value={newCode}
                onChange={(value) => setNewCode(value.toUpperCase())}
                placeholder="ABCDEF"
                className="flex-1"
              />
              <Button variant="outline" onClick={generateRandomCode}>
                자동 생성
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCodeModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreateAccessCode} disabled={!newCode.trim()}>
              생성
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
