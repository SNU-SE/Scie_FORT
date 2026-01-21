import { useState, useEffect } from 'react'
import type { Question, Option } from '@/types'
import { OptionEditor } from './OptionEditor'

type QuestionType = 'single' | 'multiple' | 'text'

interface QuestionEditorProps {
  question?: Question
  options?: Option[]
  onSave: (question: Question, options: Option[]) => void
  onCancel: () => void
  onAddCondition?: (optionId: string, currentOptions: Option[]) => void
}

export function QuestionEditor({
  question,
  options = [],
  onSave,
  onCancel,
  onAddCondition,
}: QuestionEditorProps) {
  const [questionType, setQuestionType] = useState<QuestionType>('single')
  const [questionText, setQuestionText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [required, setRequired] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<Option[]>([])

  useEffect(() => {
    if (question) {
      setQuestionType(question.type as QuestionType)
      setQuestionText(question.content)
      setImageUrl('')
      setRequired(question.is_required)
    }
    if (options.length > 0) {
      setCurrentOptions(options)
    }
  }, [question, options])

  const isChoiceType = questionType === 'single' || questionType === 'multiple'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedQuestion: Question = {
      id: question?.id ?? crypto.randomUUID(),
      survey_id: question?.survey_id ?? '',
      type: questionType,
      content: questionText,
      is_required: required,
      order_index: question?.order_index ?? 0,
      page_index: question?.page_index ?? 0,
      parent_question_id: question?.parent_question_id ?? null,
      trigger_option_ids: question?.trigger_option_ids ?? null,
      image_url: imageUrl || null,
      is_page_break: false,
      created_at: question?.created_at ?? new Date().toISOString(),
      options: currentOptions,
    }

    onSave(updatedQuestion, isChoiceType ? currentOptions : [])
  }

  const handleAddConditionInternal = (optionId: string) => {
    console.log('[QuestionEditor] handleAddCondition called', { optionId, currentOptions })
    if (onAddCondition) {
      onAddCondition(optionId, currentOptions)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            문항 유형
          </label>
          <div className="flex gap-2">
            {(['single', 'multiple', 'text'] as QuestionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setQuestionType(type)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  questionType === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'single' && '단일 선택'}
                {type === 'multiple' && '다중 선택'}
                {type === 'text' && '서술형'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="questionText"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            질문 내용 <span className="text-error">*</span>
          </label>
          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
            placeholder="질문 내용을 입력하세요"
            required
          />
        </div>

        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            이미지 URL (선택)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
            placeholder="https://example.com/image.jpg"
          />
          {imageUrl && (
            <div className="mt-3">
              <img
                src={imageUrl}
                alt="미리보기"
                className="max-w-xs max-h-40 object-contain border border-gray-200 rounded"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">필수 응답</p>
            <p className="text-xs text-gray-400 mt-1">
              응답자가 반드시 답변해야 합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRequired(!required)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              required ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                required ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {isChoiceType && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              선택지
            </label>
            <OptionEditor
              options={currentOptions}
              onChange={setCurrentOptions}
              onAddCondition={handleAddConditionInternal}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            {question ? '문항 저장' : '문항 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
