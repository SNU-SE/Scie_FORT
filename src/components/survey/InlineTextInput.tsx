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
  placeholder?: string
}

export default function InlineTextInput({
  question,
  value,
  onChange,
}: InlineTextInputProps) {
  const parsedContent = useMemo(() => {
    const content = question.content || ''
    const parts: ParsedContent[] = []
    // {{input:1}} 또는 {{input:1[placeholder텍스트]}} 형식 지원
    const regex = /\{\{input:(\d+)(?:\[([^\]]*)\])?\}\}/g
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
        placeholder: match[2] || '', // 대괄호 안의 텍스트
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
        const placeholderText = part.placeholder || ''
        return (
          <input
            key={index}
            type="text"
            value={value[inputId] || ''}
            onChange={(e) => handleInputChange(inputId, e.target.value)}
            className="
              inline-block
              min-w-24 mx-1 px-3 py-1
              border border-gray-300 rounded
              text-base text-black text-center
              bg-white
              transition-all duration-200
              focus:outline-none focus:border-black focus:ring-1 focus:ring-black
              placeholder-gray-400
            "
            placeholder={placeholderText}
            style={{ width: placeholderText ? `${Math.max(placeholderText.length * 12 + 24, 96)}px` : '96px' }}
          />
        )
      })}
    </div>
  )
}
