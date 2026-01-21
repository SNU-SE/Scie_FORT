'use client'

import type { Question, Option } from '@/types'

interface SingleChoiceProps {
  question: Question
  options: Option[]
  value: string | null
  onChange: (optionId: string) => void
  textResponses?: Record<string, string>
  onTextChange?: (optionId: string, text: string) => void
}

export default function SingleChoice({
  question,
  options,
  value,
  onChange,
  textResponses = {},
  onTextChange,
}: SingleChoiceProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = value === option.id
        const showTextInput = option.allows_text_input && isSelected

        return (
          <div key={option.id} className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onChange(option.id)}
                  className="sr-only"
                />
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-black bg-black'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
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
