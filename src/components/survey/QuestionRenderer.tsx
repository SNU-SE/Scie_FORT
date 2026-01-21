'use client'

import type { Question, Option } from '@/types'
import SingleChoice from './SingleChoice'
import MultipleChoice from './MultipleChoice'
import TextInput from './TextInput'
import InlineTextInput from './InlineTextInput'
import ConditionalQuestion from './ConditionalQuestion'

export type ResponseValue = {
  selectedOptionIds?: string[]
  textResponses?: Record<string, string>
}

interface QuestionRendererProps {
  question: Question
  options: Option[]
  response: ResponseValue
  onResponseChange: (value: ResponseValue) => void
  conditionalQuestions?: Question[]
  questionNumber?: number
}

export default function QuestionRenderer({
  question,
  options,
  response,
  onResponseChange,
  conditionalQuestions = [],
  questionNumber,
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

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single':
        return (
          <SingleChoice
            question={question}
            options={options}
            value={selectedOptionIds[0] || null}
            onChange={handleSingleChoiceChange}
          />
        )

      case 'multiple':
        return (
          <MultipleChoice
            question={question}
            options={options}
            value={selectedOptionIds}
            onChange={handleMultipleChoiceChange}
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
      const conditionalOptions = options.filter(
        (opt) => opt.question_id === conditionalQ.id
      )

      return (
        <ConditionalQuestion
          key={conditionalQ.id}
          question={conditionalQ}
          parentSelectedOptions={selectedOptionIds}
        >
          <QuestionRenderer
            question={conditionalQ}
            options={conditionalOptions}
            response={response}
            onResponseChange={onResponseChange}
          />
        </ConditionalQuestion>
      )
    })
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-black">
          {questionNumber !== undefined && (
            <span className="mr-2">{questionNumber}.</span>
          )}
          {!(question.type === 'text' && question.content?.includes('{{input:')) && question.content}
          {question.is_required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </h3>
      </div>

      <div className="pl-0">
        {renderQuestionContent()}
        {renderConditionalQuestions()}
      </div>
    </div>
  )
}
