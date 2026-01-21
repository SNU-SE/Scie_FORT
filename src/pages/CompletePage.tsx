import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/common'
import { useResponseStore } from '@/stores/responseStore'

// ============================================
// CompletePage - Survey Completion Screen
// ============================================

// Check icon SVG component
const CheckIcon = () => (
  <svg
    className="w-20 h-20 text-green-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

export default function CompletePage() {
  const navigate = useNavigate()
  const { resetStore } = useResponseStore()

  // Mounted effect
  useEffect(() => {
    console.log('[CompletePage] mounted')
  }, [])

  // Handle "Go to Home" button click
  const handleGoHome = () => {
    console.log('[CompletePage.handleGoHome] called')
    // Reset the store to clear all response data
    resetStore()
    console.log('[CompletePage] state changed', { storeReset: true })

    // Navigate to the home page
    console.log('[CompletePage] navigating to', '/')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col items-center text-center">
          {/* Check Icon */}
          <div className="mb-6">
            <CheckIcon />
          </div>

          {/* Completion Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            설문이 완료되었습니다
          </h1>

          {/* Thank You Message */}
          <p className="text-gray-600 mb-8">
            참여해 주셔서 감사합니다
          </p>

          {/* Home Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleGoHome}
            className="w-full max-w-xs"
          >
            처음으로
          </Button>
        </div>
      </Card>
    </div>
  )
}
