// ============================================
// Survey Platform - Admin Login Page
// ============================================

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { useAuth } from '@/hooks'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mounted effect
  useEffect(() => {
    console.log('[LoginPage] mounted')
  }, [])

  // 이미 로그인된 상태면 대시보드로 리다이렉트
  useEffect(() => {
    if (!isLoading && user) {
      console.log('[LoginPage] navigating to', '/admin/dashboard')
      navigate('/admin/dashboard', { replace: true })
    }
  }, [user, isLoading, navigate])

  // Log user state changes
  useEffect(() => {
    console.log('[LoginPage] state changed', { user, isLoading })
  }, [user, isLoading])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    console.log('[LoginPage.handleSubmit] called', { email })
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    console.log('[LoginPage] state changed', { isSubmitting: true })

    try {
      await login(email, password)
      console.log('[LoginPage] navigating to', '/admin/dashboard')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('[LoginPage] error', err)
      setError(
        err instanceof Error
          ? err.message
          : '로그인에 실패했습니다. 다시 시도해주세요.'
      )
    } finally {
      setIsSubmitting(false)
      console.log('[LoginPage] state changed', { isSubmitting: false })
    }
  }

  // 로딩 중이면 빈 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 이미 로그인된 상태면 렌더링하지 않음
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">SciForm Admin</h1>
          <p className="mt-2 text-gray-600">관리자 로그인</p>
        </div>

        {/* 로그인 카드 */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 이메일 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(value) => {
                  console.log('[LoginPage.handleEmailChange] called', { email: value })
                  setEmail(value)
                }}
                placeholder="admin@example.com"
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(value) => {
                  console.log('[LoginPage.handlePasswordChange] called')
                  setPassword(value)
                }}
                placeholder="비밀번호를 입력하세요"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </Card>

        {/* 하단 안내 */}
        <p className="mt-4 text-center text-sm text-gray-500">
          관리자 계정이 필요하시면 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  )
}
