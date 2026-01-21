'use client'

interface PageNavigatorProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  isFirstPage: boolean
  isLastPage: boolean
  isSubmitting?: boolean
}

export default function PageNavigator({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onSubmit,
  isFirstPage,
  isLastPage,
  isSubmitting = false,
}: PageNavigatorProps) {
  const buttonBaseStyles = `
    px-6 py-3
    text-base font-medium
    rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed
  `

  const primaryButtonStyles = `
    ${buttonBaseStyles}
    bg-black text-white
    hover:bg-gray-800
    focus:ring-black
    disabled:bg-gray-400
  `

  const secondaryButtonStyles = `
    ${buttonBaseStyles}
    bg-white text-black
    border-2 border-black
    hover:bg-gray-100
    focus:ring-black
    disabled:border-gray-300 disabled:text-gray-400
  `

  return (
    <div className="flex items-center justify-between pt-8 border-t border-gray-200">
      <div>
        {!isFirstPage && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className={secondaryButtonStyles}
          >
            이전
          </button>
        )}
      </div>

      <div>
        {isLastPage ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={primaryButtonStyles}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                제출 중...
              </span>
            ) : (
              '제출'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className={primaryButtonStyles}
          >
            다음
          </button>
        )}
      </div>
    </div>
  )
}
