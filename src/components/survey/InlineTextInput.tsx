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
  group?: string | null  // 그룹명 (null이면 그룹 없음)
  placeholder?: string
  width?: number | null  // 커스텀 너비 (픽셀)
}

export default function InlineTextInput({
  question,
  value,
  onChange,
}: InlineTextInputProps) {
  const parsedContent = useMemo(() => {
    const content = question.content || ''
    const parts: ParsedContent[] = []
    // {{input:1}}, {{input:1[placeholder]}}, {{input:1[placeholder:200]}},
    // {{g1:input:1}}, {{g1:input:1[placeholder]}}, {{g1:input:1[placeholder:200]}} 형식 지원
    // 캡처 그룹: 1=그룹명(선택), 2=입력ID, 3=placeholder(선택), 4=너비(선택)
    const regex = /\{\{(?:([a-zA-Z0-9]+):)?input:(\d+)(?:\[([^\]:]*)(?::(\d+))?\])?\}\}/g
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
        group: match[1] || null,  // 그룹명 (없으면 null)
        inputId: match[2],
        placeholder: match[3] || '', // 대괄호 안의 텍스트 (콜론 앞부분)
        width: match[4] ? parseInt(match[4], 10) : null, // 커스텀 너비 (콜론 뒷부분)
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

  // 각 그룹별로 활성화된 입력 ID 결정 (값이 입력된 첫 번째 입력)
  const activeInputByGroup = useMemo(() => {
    const result: Record<string, string> = {} // group -> inputId with value
    for (const part of parsedContent) {
      if (part.type === 'input' && part.group && part.inputId) {
        const inputValue = value[part.inputId]
        if (inputValue && inputValue.trim()) {
          // 이 그룹에 아직 활성 입력이 없으면 설정
          if (!result[part.group]) {
            result[part.group] = part.inputId
          }
        }
      }
    }
    return result
  }, [parsedContent, value])

  // 특정 입력이 비활성화되어야 하는지 확인
  // 같은 그룹 내에서 다른 입력이 값을 가지면 이 입력은 비활성화
  const isInputDisabled = (part: ParsedContent): boolean => {
    if (!part.group) return false  // 그룹 없으면 항상 활성
    const activeInputId = activeInputByGroup[part.group]
    if (!activeInputId) return false  // 이 그룹에 활성 입력 없으면 모두 활성
    return part.inputId !== activeInputId  // 활성 입력이 아니면 비활성
  }

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
        const disabled = isInputDisabled(part)

        // 너비 결정: 커스텀 너비 > placeholder 기반 계산 > 기본값
        const inputWidth = part.width
          ? `${part.width}px`
          : placeholderText
            ? `${Math.max(placeholderText.length * 12 + 24, 96)}px`
            : '96px'

        return (
          <input
            key={index}
            type="text"
            value={value[inputId] || ''}
            onChange={(e) => handleInputChange(inputId, e.target.value)}
            disabled={disabled}
            className={`
              inline-block
              min-w-24 mx-1 px-3 py-1
              border rounded
              text-base text-center
              transition-all duration-200
              ${disabled
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black'
              }
              placeholder-gray-400
            `}
            placeholder={placeholderText}
            style={{ width: inputWidth }}
          />
        )
      })}
    </div>
  )
}
