import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Card, LoadingSpinner } from '@/components/common'
import { useSurveyByCode } from '@/hooks'
import { useResponseStore } from '@/stores/responseStore'
import type { RespondentInfo, RespondentField } from '@/types'

// ============================================
// RespondentInfoPage - Respondent Information Form
// ============================================

export default function RespondentInfoPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()

  const { setRespondentInfo, setSurveyCode } = useResponseStore()

  // Local form state
  const [formData, setFormData] = useState<RespondentInfo>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch survey data
  const { data: survey, isLoading, error: queryError } = useSurveyByCode(code)

  // Mounted effect
  useEffect(() => {
    console.log('[RespondentInfoPage] mounted')
  }, [])

  // Set survey code on mount
  useEffect(() => {
    if (code) {
      console.log('[RespondentInfoPage] state changed', { surveyCode: code })
      setSurveyCode(code)
    }
  }, [code, setSurveyCode])

  // Log when survey data is loaded
  useEffect(() => {
    if (survey) {
      console.log('[RespondentInfoPage] data loaded', { data: survey })
    }
  }, [survey])

  // Log query error
  useEffect(() => {
    if (queryError) {
      console.error('[RespondentInfoPage] error', queryError)
    }
  }, [queryError])

  // Redirect logic: if survey doesn't collect respondent info, go directly to survey
  useEffect(() => {
    if (survey && survey.collect_respondent_info === false) {
      console.log('[RespondentInfoPage] navigating to', `/survey/${code}`)
      navigate(`/survey/${code}`, { replace: true })
    }
  }, [survey, code, navigate])

  // Handle input change
  const handleInputChange = (key: string, value: string) => {
    console.log('[RespondentInfoPage.handleInputChange] called', { key, value })
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
    console.log('[RespondentInfoPage] state changed', { formData: { ...formData, [key]: value } })

    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fields = survey?.respondent_fields || []

    fields.forEach((field: RespondentField) => {
      if (field.required && !formData[field.key]?.trim()) {
        newErrors[field.key] = `${field.label}을(를) 입력해주세요.`
      }
    })

    setErrors(newErrors)
    console.log('[RespondentInfoPage] state changed', { errors: newErrors })
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = () => {
    console.log('[RespondentInfoPage.handleSubmit] called', { formData })
    if (!validateForm()) {
      return
    }

    // Save respondent info to store
    setRespondentInfo(formData)

    // Navigate to survey page
    console.log('[RespondentInfoPage] navigating to', `/survey/${code}`)
    navigate(`/survey/${code}`)
  }

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
            <Button
              variant="primary"
              onClick={() => {
                console.log('[RespondentInfoPage] navigating to', '/')
                navigate('/')
              }}
            >
              처음으로
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // If survey doesn't collect respondent info, show nothing (redirect will happen)
  if (survey.collect_respondent_info === false) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const respondentFields = survey.respondent_fields || []

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg" padding="lg">
        <div className="flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-gray-600">
                {survey.description}
              </p>
            )}
          </div>

          {/* Section Title */}
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            응답자 정보
          </h2>

          {/* Form Fields */}
          <div className="space-y-4 mb-8">
            {respondentFields.map((field: RespondentField) => (
              <Input
                key={field.key}
                label={field.label}
                value={formData[field.key] || ''}
                onChange={(value) => handleInputChange(field.key, value)}
                required={field.required}
                error={errors[field.key]}
                placeholder={`${field.label}을(를) 입력하세요`}
              />
            ))}
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            className="w-full"
          >
            설문 시작하기
          </Button>
        </div>
      </Card>
    </div>
  )
}
