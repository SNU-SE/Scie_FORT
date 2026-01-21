'use client'

import { useMemo } from 'react'
import type { Question } from '@/types'

interface ConditionalQuestionProps {
  question: Question
  parentSelectedOptions: string[]
  children: React.ReactNode
}

export default function ConditionalQuestion({
  question,
  parentSelectedOptions,
  children,
}: ConditionalQuestionProps) {
  const shouldShow = useMemo(() => {
    const triggerOptionIds = question.trigger_option_ids || []

    if (triggerOptionIds.length === 0) {
      return false
    }

    return triggerOptionIds.some((triggerId) =>
      parentSelectedOptions.includes(triggerId)
    )
  }, [question.trigger_option_ids, parentSelectedOptions])

  return (
    <div
      className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${shouldShow ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
      `}
    >
      <div
        className="
          mt-4 ml-4 pl-4
          border-l-2 border-gray-200
        "
      >
        {children}
      </div>
    </div>
  )
}
