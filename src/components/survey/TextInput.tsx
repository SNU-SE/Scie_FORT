'use client'

import type { Question } from '@/types'

interface TextInputProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

export default function TextInput({
  question,
  value,
  onChange,
}: TextInputProps) {
  return (
    <div className="w-full">
      <textarea
        id={`question-${question.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="답변을 입력하세요"
        rows={4}
        className="
          w-full px-4 py-3
          border border-gray-300 rounded-lg
          text-base text-black placeholder-gray-400
          bg-white
          transition-all duration-200
          focus:outline-none focus:border-black focus:ring-1 focus:ring-black
          resize-y min-h-[120px]
        "
      />
    </div>
  )
}
