'use client'

import { useMemo } from 'react'
import type { Question } from '@/types'

interface InlineTextInputProps {
  question: Question
  value: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

type ParsedContent = {
  type: 'text' | 'input'
  content: string
  inputId?: string
}

export default function InlineTextInput({
  question,
  value,
  onChange,
}: InlineTextInputProps) {
  const parsedContent = useMemo(() => {
    const content = question.content || ''
    const parts: ParsedContent[] = []
    const regex = /\{\{input:(\d+)\}\}/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        })
      }

      parts.push({
        type: 'input',
        content: '',
        inputId: match[1],
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      })
    }

    return parts
  }, [question.content])

  const handleInputChange = (inputId: string, inputValue: string) => {
    onChange({
      ...value,
      [inputId]: inputValue,
    })
  }

  return (
    <div className="text-base leading-relaxed text-gray-800">
      {parsedContent.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {part.content}
            </span>
          )
        }

        const inputId = part.inputId!
        return (
          <input
            key={index}
            type="text"
            value={value[inputId] || ''}
            onChange={(e) => handleInputChange(inputId, e.target.value)}
            className="
              inline-block
              w-32 mx-1 px-2 py-1
              border-b-2 border-gray-300
              text-base text-black text-center
              bg-transparent
              transition-all duration-200
              focus:outline-none focus:border-black
              placeholder-gray-400
            "
            placeholder="___"
          />
        )
      })}
    </div>
  )
}
