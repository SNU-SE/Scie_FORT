// ============================================
// AI Survey Platform - AI Complete Page
// ============================================

import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/common'
import { useChatStore } from '@/stores/chatStore'

export default function AICompletePage() {
  const navigate = useNavigate()

  const { survey, session, questions, resetStore } = useChatStore()

  const handleStartOver = () => {
    resetStore()
    navigate('/ai')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            학습 완료!
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            모든 문제를 완료했어요. 수고했어요!
          </p>

          {/* Stats */}
          {session && questions.length > 0 && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {questions.length}
                  </p>
                  <p className="text-sm text-gray-500">완료한 문제</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(
                      (new Date(session.completed_at || Date.now()).getTime() -
                        new Date(session.started_at).getTime()) /
                        1000 /
                        60
                    )}분
                  </p>
                  <p className="text-sm text-gray-500">소요 시간</p>
                </div>
              </div>
            </div>
          )}

          {/* Survey Title */}
          {survey && (
            <p className="text-sm text-gray-500 mb-6">
              {survey.title}
            </p>
          )}

          {/* Actions */}
          <button
            onClick={handleStartOver}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            처음으로 돌아가기
          </button>

          {/* Footer */}
          <p className="mt-8 text-xs text-gray-400">
            답변 내용은 선생님께서 확인할 수 있어요
          </p>
        </div>
      </Card>
    </div>
  )
}
