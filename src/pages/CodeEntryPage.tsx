import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { supabase } from '@/lib/supabase'
import { useResponseStore } from '@/stores/responseStore'
import { useChatStore } from '@/stores/chatStore'

// ============================================
// CodeEntryPage - Unified Access Code Entry
// 코드 자동 판별: 일반 설문 / AI 챗봇
// ============================================

type CodeType = 'normal' | 'ai' | null

interface CodeCheckResult {
  type: CodeType
  surveyId: string | null
}

// 코드 타입 판별 함수
async function checkCodeType(code: string): Promise<CodeCheckResult> {
  // 1. 먼저 일반 설문 access_codes 테이블 검색
  const { data: normalCode, error: normalError } = await supabase
    .from('access_codes')
    .select('survey_id, is_active, expires_at')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (normalCode && !normalError) {
    // 만료 확인
    if (normalCode.expires_at && new Date(normalCode.expires_at) < new Date()) {
      // 만료된 코드 - AI 코드도 확인
    } else {
      return { type: 'normal', surveyId: normalCode.survey_id }
    }
  }

  // 2. AI 설문 ai_access_codes 테이블 검색
  const { data: aiCode, error: aiError } = await supabase
    .from('ai_access_codes')
    .select('survey_id, is_active, expires_at')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (aiCode && !aiError) {
    // 만료 확인
    if (aiCode.expires_at && new Date(aiCode.expires_at) < new Date()) {
      return { type: null, surveyId: null }
    }
    return { type: 'ai', surveyId: aiCode.survey_id }
  }

  // 3. 둘 다 없으면 null
  return { type: null, surveyId: null }
}

export default function CodeEntryPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // 일반 설문 스토어
  const { setSurveyCode, resetStore: resetResponseStore } = useResponseStore()

  // AI 챗봇 스토어
  const { resetStore: resetChatStore } = useChatStore()

  // Handle code input change
  const handleCodeChange = (value: string) => {
    const formattedCode = value.toUpperCase().slice(0, 6)
    setCode(formattedCode)
    setError(null)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.')
      return
    }

    setError(null)
    setIsValidating(true)

    try {
      const upperCode = code.toUpperCase()
      const result = await checkCodeType(upperCode)

      if (result.type === 'normal') {
        // 일반 설문으로 이동
        resetResponseStore()
        setSurveyCode(upperCode)
        navigate(`/info/${upperCode}`)
      } else if (result.type === 'ai') {
        // AI 챗봇으로 이동
        resetChatStore()
        navigate(`/ai/${upperCode}/info`)
      } else {
        // 유효하지 않은 코드
        setError('유효하지 않은 코드입니다. 다시 확인해주세요.')
      }
    } catch (err) {
      console.error('Code validation error:', err)
      setError('코드 확인 중 오류가 발생했습니다.')
    } finally {
      setIsValidating(false)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isValidating) {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            과학 수업 통합 플랫폼
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">
            접속 코드를 입력하세요
          </p>

          {/* Code Input */}
          <div className="w-full mb-6" onKeyDown={handleKeyDown}>
            <Input
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              error={error || undefined}
              className="text-center text-2xl tracking-widest"
              disabled={isValidating}
            />
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={code.length !== 6 || isValidating}
            isLoading={isValidating}
            className="w-full"
          >
            시작하기
          </Button>

          {/* Helper text */}
          <p className="mt-6 text-xs text-gray-400 text-center">
            선생님께서 알려주신 6자리 코드를 입력하세요
          </p>
        </div>
      </Card>
    </div>
  )
}
