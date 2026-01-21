import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question, Option, ImagePosition } from '@/types'
import { OptionEditor } from './OptionEditor'
import { supabase } from '@/lib/supabase'

type QuestionType = 'single' | 'multiple' | 'text'

const IMAGE_POSITIONS: { value: ImagePosition; label: string }[] = [
  { value: 'left', label: '왼쪽' },
  { value: 'right', label: '오른쪽' },
  { value: 'top', label: '위' },
  { value: 'bottom', label: '아래' },
]

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
  const [imagePosition, setImagePosition] = useState<ImagePosition>('left')
  const [required, setRequired] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<Option[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (question) {
      setQuestionType(question.type as QuestionType)
      setQuestionText(question.content)
      setImageUrl(question.image_url || '')
      setImagePosition(question.image_position || 'left')
      setRequired(question.is_required)
    }
    if (options.length > 0) {
      setCurrentOptions(options)
    }
  }, [question, options])

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

      // 드롭 위치 계산을 위해 document.caretPositionFromPoint 사용
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedQuestion: Question = {
      id: question?.id ?? `temp_${crypto.randomUUID()}`,
      survey_id: question?.survey_id ?? '',
      type: questionType,
      content: questionText,
      is_required: required,
      order_index: question?.order_index ?? 0,
      page_index: question?.page_index ?? 0,
      parent_question_id: question?.parent_question_id ?? null,
      trigger_option_ids: question?.trigger_option_ids ?? null,
      image_url: imageUrl || null,
      image_position: imagePosition,
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
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
            ref={textareaRef}
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onDrop={handleTextareaDrop}
            onDragOver={handleTextareaDragOver}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
            placeholder="질문 내용을 입력하세요"
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
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="text-gray-500">
                  <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  업로드 중...
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    클릭하여 이미지 선택 또는 드래그 앤 드롭
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ctrl+V로 클립보드 이미지 붙여넣기 가능
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
            <div className="mt-4">
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
