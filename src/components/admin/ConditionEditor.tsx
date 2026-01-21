import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question, Option, ImagePosition } from '@/types'
import { supabase } from '@/lib/supabase'

type QuestionType = 'single' | 'multiple' | 'text'

// 임시 옵션 ID 생성
const generateTempOptionId = () => `temp_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const IMAGE_POSITIONS: { value: ImagePosition; label: string }[] = [
  { value: 'left', label: '왼쪽' },
  { value: 'right', label: '오른쪽' },
  { value: 'top', label: '위' },
  { value: 'bottom', label: '아래' },
]

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
  const [imagePosition, setImagePosition] = useState<ImagePosition>('left')
  const [required, setRequired] = useState(false)
  const [questionOptions, setQuestionOptions] = useState<Option[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (conditionalQuestion) {
      setQuestionType(conditionalQuestion.type as QuestionType)
      setQuestionText(conditionalQuestion.content)
      setImageUrl(conditionalQuestion.image_url || '')
      setImagePosition(conditionalQuestion.image_position || 'left')
      setRequired(conditionalQuestion.is_required)
      setQuestionOptions(conditionalQuestion.options || [])
      // 기존 트리거 옵션 설정
      setSelectedOptionIds(conditionalQuestion.trigger_option_ids || [])
    }
  }, [conditionalQuestion])

  // Upload image to Supabase Storage
  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `question-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('survey-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('survey-images')
        .getPublicUrl(filePath)

      setImageUrl(urlData.publicUrl)
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }, [uploadImage])

  // Handle paste event for clipboard images
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          uploadImage(file)
        }
        break
      }
    }
  }, [uploadImage])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadImage(file)
    }
  }, [uploadImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Add paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Remove image
  const handleRemoveImage = useCallback(() => {
    setImageUrl('')
  }, [])

  const isChoiceType = questionType === 'single' || questionType === 'multiple'

  // 다음 인라인 입력 번호 계산
  const getNextInputNumber = useCallback(() => {
    const regex = /\{\{input:(\d+)/g
    let maxNum = 0
    let match
    while ((match = regex.exec(questionText)) !== null) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
    return maxNum + 1
  }, [questionText])

  // 인라인 입력 삽입
  const insertInlineInput = useCallback((position?: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const nextNum = getNextInputNumber()
    const insertText = `{{input:${nextNum}[입력]}}`

    const cursorPos = position ?? textarea.selectionStart ?? questionText.length
    const newText = questionText.slice(0, cursorPos) + insertText + questionText.slice(cursorPos)
    setQuestionText(newText)

    // 커서를 삽입된 텍스트 뒤로 이동
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = cursorPos + insertText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [questionText, getNextInputNumber])

  // 인라인 입력 버튼 드래그 시작
  const handleInlineInputDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'inline-input')
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  // textarea에 드롭
  const handleTextareaDrop = useCallback((e: React.DragEvent) => {
    const data = e.dataTransfer.getData('text/plain')
    if (data === 'inline-input') {
      e.preventDefault()
      e.stopPropagation()

      const textarea = textareaRef.current
      if (!textarea) return

      // 드롭 위치 계산
      let position = questionText.length
      if (document.caretPositionFromPoint) {
        const caretPos = document.caretPositionFromPoint(e.clientX, e.clientY)
        if (caretPos) {
          position = caretPos.offset
        }
      } else if ((document as unknown as { caretRangeFromPoint: (x: number, y: number) => Range | null }).caretRangeFromPoint) {
        const range = (document as unknown as { caretRangeFromPoint: (x: number, y: number) => Range | null }).caretRangeFromPoint(e.clientX, e.clientY)
        if (range) {
          position = range.startOffset
        }
      }

      insertInlineInput(position)
    }
  }, [questionText, insertInlineInput])

  const handleTextareaDragOver = useCallback((e: React.DragEvent) => {
    const data = e.dataTransfer.types.includes('text/plain')
    if (data) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

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
      image_position: imagePosition,
      is_page_break: false,
      created_at: conditionalQuestion?.created_at ?? new Date().toISOString(),
      options: isChoiceType ? questionOptions : [],
    }

    onSave(newQuestion, selectedOptionIds)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
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
            ref={textareaRef}
            id="conditionQuestionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onDrop={handleTextareaDrop}
            onDragOver={handleTextareaDragOver}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
            placeholder="조건부 질문 내용을 입력하세요"
            required
          />

          {/* 서술형일 때 인라인 입력 버튼 */}
          {questionType === 'text' && (
            <div className="mt-2 flex items-center gap-2">
              <div
                draggable
                onDragStart={handleInlineInputDragStart}
                onClick={() => insertInlineInput()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors select-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                인라인 입력
              </div>
              <span className="text-xs text-gray-400">
                드래그하여 원하는 위치에 놓거나 클릭하여 추가
              </span>
            </div>
          )}
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
          <label className="block text-sm font-medium text-gray-900 mb-2">
            이미지 (선택)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!imageUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="text-gray-500 text-sm">업로드 중...</div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    클릭 또는 드래그 앤 드롭
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ctrl+V로 붙여넣기 가능
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="미리보기"
                className="h-[100px] w-auto object-contain border border-gray-200 rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 이미지 위치 선택 */}
          {imageUrl && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 위치
              </label>
              <div className="flex gap-2">
                {IMAGE_POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setImagePosition(pos.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      imagePosition === pos.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
