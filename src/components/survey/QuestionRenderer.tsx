'use client'

import type { Question, Option, ImagePosition } from '@/types'
import SingleChoice from './SingleChoice'
import MultipleChoice from './MultipleChoice'
import TextInput from './TextInput'
import InlineTextInput from './InlineTextInput'
import ConditionalQuestion from './ConditionalQuestion'

export type ResponseValue = {
  selectedOptionIds?: string[]
  textResponses?: Record<string, string>
}

// Image component for question
function QuestionImage({ src, position }: { src: string; position: ImagePosition }) {
  const isHorizontal = position === 'left' || position === 'right'

  return (
    <div className={`flex-shrink-0 ${isHorizontal ? 'w-1/2' : 'w-full'}`}>
      <img
        src={src}
        alt="문항 이미지"
        className="w-full h-auto object-contain rounded-lg"
      />
    </div>
  )
}

interface QuestionRendererProps {
  question: Question
  options: Option[]
  response: ResponseValue
  onResponseChange: (value: ResponseValue) => void
  conditionalQuestions?: Question[]
  questionNumber?: number
  // 조건부 질문 응답 저장용
  allResponses?: Record<string, ResponseValue>
  onResponseChangeById?: (questionId: string, value: ResponseValue) => void
  // 유효성 검사 에러 표시용
  hasError?: boolean
  errorQuestionIds?: string[]
}

export default function QuestionRenderer({
  question,
  options,
  response,
  onResponseChange,
  conditionalQuestions = [],
  questionNumber,
  allResponses = {},
  onResponseChangeById,
  hasError = false,
  errorQuestionIds = [],
}: QuestionRendererProps) {
  const selectedOptionIds = response.selectedOptionIds || []
  const textResponses = response.textResponses || {}

  const handleSingleChoiceChange = (optionId: string) => {
    onResponseChange({
      ...response,
      selectedOptionIds: [optionId],
    })
  }

  const handleMultipleChoiceChange = (optionIds: string[]) => {
    onResponseChange({
      ...response,
      selectedOptionIds: optionIds,
    })
  }

  const handleTextChange = (value: string) => {
    onResponseChange({
      ...response,
      textResponses: {
        ...textResponses,
        main: value,
      },
    })
  }

  const handleInlineTextChange = (values: Record<string, string>) => {
    onResponseChange({
      ...response,
      textResponses: values,
    })
  }

  const handleOptionTextChange = (optionId: string, text: string) => {
    onResponseChange({
      ...response,
      textResponses: {
        ...textResponses,
        [optionId]: text,
      },
    })
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single':
        return (
          <SingleChoice
            question={question}
            options={options}
            value={selectedOptionIds[0] || null}
            onChange={handleSingleChoiceChange}
            textResponses={textResponses}
            onTextChange={handleOptionTextChange}
          />
        )

      case 'multiple':
        return (
          <MultipleChoice
            question={question}
            options={options}
            value={selectedOptionIds}
            onChange={handleMultipleChoiceChange}
            textResponses={textResponses}
            onTextChange={handleOptionTextChange}
          />
        )

      case 'text':
        // Check if content has inline input placeholders
        if (question.content && question.content.includes('{{input:')) {
          return (
            <InlineTextInput
              question={question}
              value={textResponses}
              onChange={handleInlineTextChange}
            />
          )
        }
        return (
          <TextInput
            question={question}
            value={textResponses.main || ''}
            onChange={handleTextChange}
          />
        )

      default:
        return (
          <div className="text-gray-500 italic">
            지원하지 않는 문항 유형입니다.
          </div>
        )
    }
  }

  const renderConditionalQuestions = () => {
    if (conditionalQuestions.length === 0) return null

    return conditionalQuestions.map((conditionalQ) => {
      // 조건부 질문 자체의 옵션 사용
      const conditionalOptions = conditionalQ.options || []

      // 조건부 질문은 별도 ID로 응답 저장
      const conditionalResponse = allResponses[conditionalQ.id] || {}
      const handleConditionalChange = (value: ResponseValue) => {
        if (onResponseChangeById) {
          onResponseChangeById(conditionalQ.id, value)
        }
      }

      return (
        <ConditionalQuestion
          key={conditionalQ.id}
          question={conditionalQ}
          parentSelectedOptions={selectedOptionIds}
        >
          <QuestionRenderer
            question={conditionalQ}
            options={conditionalOptions}
            response={conditionalResponse}
            onResponseChange={handleConditionalChange}
            allResponses={allResponses}
            onResponseChangeById={onResponseChangeById}
            hasError={errorQuestionIds.includes(conditionalQ.id)}
            errorQuestionIds={errorQuestionIds}
          />
        </ConditionalQuestion>
      )
    })
  }

  const imageUrl = question.image_url
  const imagePosition = question.image_position || 'left'
  const hasImage = !!imageUrl
  const isHorizontalLayout = hasImage && (imagePosition === 'left' || imagePosition === 'right')
  const isVerticalLayout = hasImage && (imagePosition === 'top' || imagePosition === 'bottom')

  // Question header - red text if has error
  const questionHeader = (
    <div className="mb-4">
      <h3 className={`text-lg font-medium ${hasError ? 'text-red-600' : 'text-black'}`}>
        {questionNumber !== undefined && (
          <span className="mr-2">{questionNumber}.</span>
        )}
        {!(question.type === 'text' && question.content?.includes('{{input:')) && question.content}
        {question.is_required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </h3>
    </div>
  )

  // Question content (options/input)
  const questionContent = (
    <div className="pl-0">
      {renderQuestionContent()}
      {renderConditionalQuestions()}
    </div>
  )

  // Render with image layout
  if (isHorizontalLayout) {
    return (
      <div className="mb-8">
        {questionHeader}
        <div className={`flex gap-6 ${imagePosition === 'right' ? 'flex-row-reverse' : ''}`}>
          <QuestionImage src={imageUrl!} position={imagePosition} />
          <div className="w-1/2">{questionContent}</div>
        </div>
      </div>
    )
  }

  if (isVerticalLayout) {
    return (
      <div className="mb-8">
        {questionHeader}
        {imagePosition === 'top' && (
          <div className="mb-4">
            <QuestionImage src={imageUrl!} position={imagePosition} />
          </div>
        )}
        {questionContent}
        {imagePosition === 'bottom' && (
          <div className="mt-4">
            <QuestionImage src={imageUrl!} position={imagePosition} />
          </div>
        )}
      </div>
    )
  }

  // Default: no image
  return (
    <div className="mb-8">
      {questionHeader}
      {questionContent}
    </div>
  )
}
