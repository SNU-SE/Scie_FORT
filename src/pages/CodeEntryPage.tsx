import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { useSurveyByCode } from '@/hooks'
import { useResponseStore } from '@/stores/responseStore'

// ============================================
// CodeEntryPage - Survey Access Code Entry
// ============================================

export default function CodeEntryPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [submittedCode, setSubmittedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { setSurveyCode, resetStore } = useResponseStore()

  // Query for survey by code (enabled only when submittedCode is set)
  const { data, isLoading, isFetching, isError } = useSurveyByCode(
    submittedCode ?? undefined
  )

  // Mounted effect
  useEffect(() => {
    console.log('[CodeEntryPage] mounted')
  }, [])

  // Handle query result
  useEffect(() => {
    if (!submittedCode) return

    // Still loading
    if (isFetching) return

    console.log('[CodeEntryPage] query result', { data, isError, submittedCode })

    if (data) {
      // Success - reset store and navigate
      resetStore()
      setSurveyCode(submittedCode)
      console.log('[CodeEntryPage] navigating to', `/info/${submittedCode}`)
      navigate(`/info/${submittedCode}`)
    } else if (!isFetching) {
      // Query completed but no data found
      setError('유효하지 않은 코드입니다. 다시 확인해주세요.')
      setSubmittedCode(null)
      console.log('[CodeEntryPage] invalid code, reset submittedCode')
    }
  }, [data, isFetching, isError, submittedCode, navigate, resetStore, setSurveyCode])

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
  const handleSubmit = () => {
    console.log('[CodeEntryPage.handleSubmit] called', { code })
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.')
      return
    }

    setError(null)
    // Set submittedCode to trigger the query
    const upperCode = code.toUpperCase()
    console.log('[CodeEntryPage] setting submittedCode', { upperCode })
    setSubmittedCode(upperCode)
  }

  const isValidating = !!submittedCode && isFetching

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
