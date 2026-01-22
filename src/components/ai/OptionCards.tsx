// ============================================
// AI Survey Platform - Option Cards Component
// ============================================

import type { AIOption } from '@/types/ai'

interface OptionCardsProps {
  options: AIOption[]
  selectedOptionId?: string
  onSelect?: (option: AIOption) => void
  disabled?: boolean
}

export function OptionCards({
  options,
  selectedOptionId,
  onSelect,
  disabled,
}: OptionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option, index) => {
        const letter = String.fromCharCode(65 + index) // A, B, C, D
        const isSelected = selectedOptionId === option.id

        return (
          <button
            key={option.id}
            onClick={() => onSelect?.(option)}
            disabled={disabled || !!selectedOptionId}
            className={`
              p-3 rounded-xl border-2 text-left transition-all
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : selectedOptionId
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <span
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold
                  ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : selectedOptionId || disabled
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {letter}
              </span>
              <span className="text-sm leading-tight">{option.option_text}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
