import { useState, useEffect } from 'react'
import type { Question, Option } from '@/types'

type QuestionType = 'single' | 'multiple' | 'text'

// 임시 옵션 ID 생성
const generateTempOptionId = () => `temp_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

interface ConditionEditorProps {
  parentQuestion: Question
  parentOptions: Option[]
  conditionalQuestion?: Question
  onSave: (question: Question, triggerOptionIds: string[]) => void
  onCancel: () => void
}

export function ConditionEditor({
  parentQuestion,
  parentOptions,
  conditionalQuestion,
  onSave,
  onCancel,
}: ConditionEditorProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [questionType, setQuestionType] = useState<QuestionType>('single')
  const [questionText, setQuestionText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [required, setRequired] = useState(false)
  const [questionOptions, setQuestionOptions] = useState<Option[]>([])

  useEffect(() => {
    if (conditionalQuestion) {
      setQuestionType(conditionalQuestion.type as QuestionType)
      setQuestionText(conditionalQuestion.content)
      setImageUrl('')
      setRequired(conditionalQuestion.is_required)
      setQuestionOptions(conditionalQuestion.options || [])
    }
  }, [conditionalQuestion])

  const isChoiceType = questionType === 'single' || questionType === 'multiple'

  // 옵션 추가
  const handleAddOption = () => {
    const newOption: Option = {
      id: generateTempOptionId(),
      question_id: '',
      content: '',
      order_index: questionOptions.length,
      allows_text_input: false,
      created_at: new Date().toISOString(),
    }
    setQuestionOptions([...questionOptions, newOption])
  }

  // 옵션 삭제
  const handleDeleteOption = (optionId: string) => {
    setQuestionOptions(questionOptions.filter(opt => opt.id !== optionId))
  }

  // 옵션 내용 변경
  const handleOptionChange = (optionId: string, content: string) => {
    setQuestionOptions(questionOptions.map(opt =>
      opt.id === optionId ? { ...opt, content } : opt
    ))
  }

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedOptionIds.length === 0) {
      alert('트리거 옵션을 하나 이상 선택해주세요.')
      return
    }

    const newQuestion: Question = {
      id: conditionalQuestion?.id ?? `temp_${crypto.randomUUID()}`,
      survey_id: parentQuestion.survey_id,
      type: questionType,
      content: questionText,
      is_required: required,
      order_index: conditionalQuestion?.order_index ?? parentQuestion.order_index + 1,
      page_index: parentQuestion.page_index,
      parent_question_id: parentQuestion.id,
      trigger_option_ids: null,
      image_url: imageUrl || null,
      image_position: 'left',
      is_page_break: false,
      created_at: conditionalQuestion?.created_at ?? new Date().toISOString(),
      options: isChoiceType ? questionOptions : [],
    }

    onSave(newQuestion, selectedOptionIds)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          조건부 질문 설정
        </h3>
        <p className="text-sm text-gray-400">
          부모 질문: {parentQuestion.content}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            트리거 옵션 선택 <span className="text-error">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            선택한 옵션 중 하나라도 선택되면 조건부 질문이 표시됩니다.
          </p>
          <div className="space-y-2">
            {parentOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOptionIds.includes(option.id)
                    ? 'border-gray-900 bg-gray-100'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedOptionIds.includes(option.id)}
                  onChange={() => handleOptionToggle(option.id)}
                  className="w-4 h-4 accent-gray-900"
                />
                <span className="text-sm text-gray-900">
                  {option.content || `옵션 ${option.order_index}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            조건부 질문 유형
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
            htmlFor="conditionQuestionText"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            조건부 질문 내용 <span className="text-error">*</span>
          </label>
          <textarea
            id="conditionQuestionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
            placeholder="조건부 질문 내용을 입력하세요"
            required
          />
        </div>

        {/* 선택형일 때 보기 편집 */}
        {isChoiceType && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              보기 (선택지)
            </label>
            <div className="space-y-2">
              {questionOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={option.content}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-sm"
                    placeholder={`보기 ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteOption(option.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 px-4 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors w-full"
            >
              + 보기 추가
            </button>
          </div>
        )}

        <div>
          <label
            htmlFor="conditionImageUrl"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            이미지 URL (선택)
          </label>
          <input
            type="url"
            id="conditionImageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">필수 응답</p>
            <p className="text-xs text-gray-400 mt-1">
              조건 충족 시 반드시 답변해야 합니다.
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
            {conditionalQuestion ? '저장' : '조건부 질문 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
