// ============================================
// AI Survey Platform - AI Student Info Page
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Card, LoadingSpinner } from '@/components/common'
import { useAISurveyByCode, useCreateAISession } from '@/hooks/useAI'
import { useChatStore } from '@/stores/chatStore'
import type { StudentInfo } from '@/types/ai'

export default function AIStudentInfoPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()

  const {
    survey,
    setSurvey,
    setQuestions,
    setSession,
    setStudentInfo,
    setAccessCode,
  } = useChatStore()

  // Fetch survey if not in store
  const { data: surveyData, isLoading, error } = useAISurveyByCode(
    !survey ? code : undefined
  )

  const createSessionMutation = useCreateAISession()

  const [formData, setFormData] = useState<StudentInfo>({
    student_id: '',
    student_name: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load survey data if coming directly to this page
  useEffect(() => {
    if (surveyData && !survey) {
      setSurvey(surveyData)
      setQuestions(surveyData.questions || [])

      // Find the access code
      const accessCode = surveyData.access_codes?.find(ac => ac.code === code)
      if (accessCode) {
        setAccessCode(accessCode)
      }
    }
  }, [surveyData, survey, code, setSurvey, setQuestions, setAccessCode])

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.student_id.trim()) {
      setFormError('학번을 입력해주세요.')
      return
    }
    if (!formData.student_name.trim()) {
      setFormError('이름을 입력해주세요.')
      return
    }

    const currentSurvey = survey || surveyData
    if (!currentSurvey || !code) {
      setFormError('설문 정보를 불러오는데 실패했습니다.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // Find access code
      const accessCode = currentSurvey.access_codes?.find(ac => ac.code === code)

      // Create session
      const session = await createSessionMutation.mutateAsync({
        survey_id: currentSurvey.id,
        access_code_id: accessCode?.id,
        student_id: formData.student_id.trim(),
        student_name: formData.student_name.trim(),
        current_question_index: 0,
        hints_used: {},
        status: 'in_progress',
      })

      // Update store
      setSession(session)
      setStudentInfo({
        student_id: formData.student_id.trim(),
        student_name: formData.student_name.trim(),
      })

      // Navigate to chat
      navigate(`/ai/${code}/chat`)
    } catch (err) {
      console.error('Session creation error:', err)
      setFormError('세션 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || (!survey && !surveyData)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              설문을 찾을 수 없습니다.
            </p>
            <Button onClick={() => navigate('/ai')}>
              처음으로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const currentSurvey = survey || surveyData

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {currentSurvey?.title}
            </h1>
            {currentSurvey?.description && (
              <p className="text-gray-600 text-sm">
                {currentSurvey.description}
              </p>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학번
              </label>
              <Input
                value={formData.student_id}
                onChange={(value) =>
                  setFormData({ ...formData, student_id: value })
                }
                placeholder="예: 20260101"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <Input
                value={formData.student_name}
                onChange={(value) =>
                  setFormData({ ...formData, student_name: value })
                }
                placeholder="예: 홍길동"
                disabled={isSubmitting}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full mt-4"
            >
              학습 시작하기
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              입력한 정보는 학습 진행 확인을 위해서만 사용됩니다.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
