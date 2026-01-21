'use client'

import type { Question, Option } from '@/types'

interface MultipleChoiceProps {
  question: Question
  options: Option[]
  value: string[]
  onChange: (optionIds: string[]) => void
  textResponses?: Record<string, string>
  onTextChange?: (optionId: string, text: string) => void
}

export default function MultipleChoice({
  question,
  options,
  value,
  onChange,
  textResponses = {},
  onTextChange,
}: MultipleChoiceProps) {
  const handleToggle = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId))
    } else {
      onChange([...value, optionId])
    }
  }

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = value.includes(option.id)
        const showTextInput = option.allows_text_input && isSelected

        return (
          <div key={option.id} className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => handleToggle(option.id)}
                  className="sr-only"
                />
                <div
                  className={`
                    w-5 h-5 rounded border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-black bg-black'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }
                  `}
                >
                  {isSelected && (
                    <svg
                      className="absolute inset-0 w-5 h-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span
                className={`
                  text-base leading-relaxed transition-colors duration-200
                  ${isSelected ? 'text-black font-medium' : 'text-gray-700 group-hover:text-black'}
                `}
              >
                {option.content}
              </span>
            </label>
            {showTextInput && (
              <div className="ml-8">
                <input
                  type="text"
                  value={textResponses[option.id] || ''}
                  onChange={(e) => onTextChange?.(option.id, e.target.value)}
                  placeholder="내용을 입력해주세요"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
