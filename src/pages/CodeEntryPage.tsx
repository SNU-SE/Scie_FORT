import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, LoadingSpinner } from '@/components/common'
import { useSurveyByCode } from '@/hooks'
import { useResponseStore } from '@/stores/responseStore'

// ============================================
// CodeEntryPage - Survey Access Code Entry
// ============================================

export default function CodeEntryPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setSurveyCode, resetStore } = useResponseStore()

  // Query for survey by code (enabled only when validating)
  const { data: survey, isLoading, refetch } = useSurveyByCode(
    isValidating ? code.toUpperCase() : undefined
  )

  // Mounted effect
  useEffect(() => {
    console.log('[CodeEntryPage] mounted')
  }, [])

  // Handle code input change
  const handleCodeChange = (value: string) => {
    console.log('[CodeEntryPage.handleCodeChange] called', { value })
    // Convert to uppercase and limit to 6 characters
    const formattedCode = value.toUpperCase().slice(0, 6)
    setCode(formattedCode)
    console.log('[CodeEntryPage] state changed', { code: formattedCode })
    setError(null)
  }

  // Handle form submission
  const handleSubmit = async () => {
    console.log('[CodeEntryPage.handleSubmit] called', { code })
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.')
      return
    }

    setIsValidating(true)
    console.log('[CodeEntryPage] state changed', { isValidating: true })
    setError(null)

    try {
      const result = await refetch()
      console.log('[CodeEntryPage] data loaded', { data: result.data })

      if (result.data) {
        // Reset store and set new survey code
        resetStore()
        setSurveyCode(code.toUpperCase())

        // Navigate to respondent info page
        console.log('[CodeEntryPage] navigating to', `/info/${code.toUpperCase()}`)
        navigate(`/info/${code.toUpperCase()}`)
      } else {
        setError('유효하지 않은 코드입니다. 다시 확인해주세요.')
        setIsValidating(false)
        console.log('[CodeEntryPage] state changed', { isValidating: false })
      }
    } catch (err) {
      console.error('[CodeEntryPage] error', err)
      setError('코드 확인 중 오류가 발생했습니다.')
      setIsValidating(false)
      console.log('[CodeEntryPage] state changed', { isValidating: false })
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      console.log('[CodeEntryPage.handleKeyDown] called', { key: e.key })
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SciForm
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">
            설문 접속 코드를 입력하세요
          </p>

          {/* Code Input */}
          <div className="w-full mb-6" onKeyDown={handleKeyDown}>
            <Input
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              error={error || undefined}
              className="text-center"
              disabled={isValidating}
            />
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={code.length !== 6 || isValidating}
            isLoading={isValidating || isLoading}
            className="w-full"
          >
            시작하기
          </Button>
        </div>
      </Card>
    </div>
  )
}
