import React from 'react'
import Button from './Button'

interface SurveyLayoutProps {
  children: React.ReactNode
  imageUrl?: string
  imageAlt?: string
  currentStep: number
  totalSteps: number
  onPrevious?: () => void
  onNext?: () => void
  isPreviousDisabled?: boolean
  isNextDisabled?: boolean
  isNextLoading?: boolean
  nextButtonText?: string
  previousButtonText?: string
  showNavigation?: boolean
}

const SurveyLayout: React.FC<SurveyLayoutProps> = ({
  children,
  imageUrl,
  imageAlt = '설문 이미지',
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isPreviousDisabled = false,
  isNextDisabled = false,
  isNextLoading = false,
  nextButtonText = '다음',
  previousButtonText = '이전',
  showNavigation = true,
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-primary-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Survey</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-black rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {currentStep}/{totalSteps}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row">
          {/* Left: Image Section (only shown when imageUrl exists) */}
          {imageUrl && (
            <div className="lg:w-1/2 bg-gray-100 flex items-center justify-center p-6 lg:p-12">
              <div className="w-full h-full max-h-[60vh] lg:max-h-full flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Right: Form Section (full width when no image) */}
          <div className={`${imageUrl ? 'lg:w-1/2' : 'w-full'} bg-primary-white flex flex-col`}>
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      {showNavigation && (
        <footer className="bg-primary-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            {onPrevious && (
              <Button
                variant="outline"
                size="lg"
                onClick={onPrevious}
                disabled={isPreviousDisabled}
              >
                {previousButtonText}
              </Button>
            )}
            {onNext && (
              <Button
                variant="primary"
                size="lg"
                onClick={onNext}
                disabled={isNextDisabled}
                isLoading={isNextLoading}
              >
                {nextButtonText}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}

export default SurveyLayout
